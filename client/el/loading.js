
import { LitElement, html, css } from 'lit';

class PinkgillLoading extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      --pulse-fill: var(--electric-dark);
    }
    div {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
    span {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 6rem;
      margin-top: 3rem;
      margin-bottom: 3rem;
    }
    span::before, span::after {
      content: "";
      position: absolute;
      border-radius: 50%;
      animation: pulsOut 1.8s ease-in-out infinite;
      filter: drop-shadow(0 0 1rem rgba(255, 255, 255, 0.75));
    }
    span::before {
      width: 100%;
      padding-bottom: 100%;
      box-shadow: inset 0 0 0 1rem var(--pulse-fill);
      animation-name: pulsIn;
    }
    span::after {
      width: calc(100% - 2rem);
      padding-bottom: calc(100% - 2rem);
      box-shadow: 0 0 0 0 var(--pulse-fill);
    }
    @keyframes pulsIn {
      0% {
        box-shadow: inset 0 0 0 1rem var(--pulse-fill);
        opacity: 1;
      }
      50%, 100% {
        box-shadow: inset 0 0 0 0 var(--pulse-fill);
        opacity: 0;
      }
    }
    @keyframes pulsOut {
      0%, 50% {
        box-shadow: 0 0 0 0 var(--pulse-fill);
        opacity: 0;
      }
      100% {
        box-shadow: 0 0 0 1rem var(--pulse-fill);
        opacity: 1;
      }
    }
  `;
  render () {
    return html`<div><span></span></div>`;
  }
}
customElements.define('pg-loading', PinkgillLoading);
