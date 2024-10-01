
import { css } from 'lit';

export const header2 = css`
  h2 {
    font-family: var(--header-fam);
    font-size: 1rem;
    font-weight: 900;
    text-decoration: underline;
    text-decoration-color: var(--electric-bright);
    text-decoration-thickness: 2px;
    margin: 0;
  }
`;

export const buttons = css`
  sl-button.action::part(base) {
    background-color: var(--electric-dark);
    border-color: var(--electric-dark);
    color: #fff;
    transition: all var(--sl-transition-medium);
  }
  sl-button.action::part(base):hover {
    background-color: var(--deeper-bright);
    border-color: var(--deeper-bright);
  }
`;

export const errors = css`
  .error {
    color: var(--sl-color-danger-500);
  }
`;
