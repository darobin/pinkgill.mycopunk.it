#!/usr/bin/env node

import process from "node:process";
import { join } from "node:path";
import { program  } from "commander";
import keytar from "keytar";
import Greenlock from 'greenlock';
import gstore from 'greenlock-store-fs';
import gandi from 'acme-dns-01-gandi';
import { execa } from 'execa';
import makeRel from "../lib/rel.js";

const SERVICE = 'space.polypod.tls';
const ACCOUNT = 'gandi';
const EMAIL = 'robin@berjon.com';
const rel = makeRel(import.meta.url);
const basePath = rel('../scratch/greenlock');
const env = 'prod';
const domains = [`polypod.space`, `*.polypod.space`, `*.tile.polypod.space`];

program
  .command('token <token>')
  .description('Set your Gandi token to authenticate')
  .action(async (token) => {
    try {
      await setToken(token);
      console.warn(`Token set successfully.`);
    }
    catch (err) {
      console.warn(`Failed to set token:`, err.message);
    }
  })
;

program
  .command('local')
  .description('Generate a local cert')
  .action(async () => {
    try {
      await localCert();
      console.warn(`Cert generated successfully.`);
    }
    catch (err) {
      console.warn(`Failed to generate cert:`, err.message);
    }
  })
;

program
  .command('production')
  .description('Generate a production cert')
  .action(async () => {
    try {
      await productionCert();
      console.warn(`Cert generated successfully.`);
    }
    catch (err) {
      console.warn(`Failed to generate cert:`, err.message);
    }
  })
;

program.parseAsync(process.argv);

async function setToken (token) {
  return keytar.setPassword(SERVICE, ACCOUNT, token);
}

async function getToken () {
  return keytar.getPassword(SERVICE, ACCOUNT);
}

async function generateCert () {
  const token = await getToken();
  if (!token) throw new Error('No token set.');
  const dns01 = gandi.create({ token });
  const g = Greenlock.create({
    packageRoot: rel('..'),
    maintainerEmail: EMAIL,
    agreeToTerms: true,
    subscriberEmail: EMAIL,
    challenges: { 'dns-01': dns01 },
    store: gstore,
    basePath,
    env,
    notify: (ev, details) => {
      console.warn(`NOTIFY`, ev, details);
    },
  });
  await g.register({
    challengeType: 'dns-01',
    domains,
    agreeTos: true,
    email: EMAIL,
    rsaKeySize: 2048,
  });
}

async function localCert () {
  await generateCert();
  console.warn(`Certificate generated into ${join(basePath, env, domains[0])}`);
}

async function productionCert () {
  const localDir = join(basePath, env, domains[0]);
  const res = await Promise.all(
    ['privkey', 'fullchain'].map(n => {
      return execa('scp', [join(localDir, `${n}.pem`), `root@${process.env.POLITY2}:/var/www/certs/${n}.pem`]);
    })
  );
  res.forEach(({ all }) => all && console.warn(all));
  const { all } = await execa('ssh', ['-l', 'root', process.env.POLITY2, 'systemctl reload caddy']);
  if (all) console.warn(all);
}
