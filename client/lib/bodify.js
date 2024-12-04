
export default function bodify (body, fetchConfiguration) {
  if (body == null) fetchConfiguration.body = '';
  else if (typeof body === 'string' || body.constructor === FormData) fetchConfiguration.body = body;
  else {
    if (!fetchConfiguration.headers) fetchConfiguration.headers = {};
    fetchConfiguration.headers['content-type'] = 'application/json';
    fetchConfiguration.body = JSON.stringify(body);
  }
  return fetchConfiguration;
}
