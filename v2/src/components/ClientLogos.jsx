import { sitePath } from '../routes.js'
import clients from '../content/training-clients.json'
import './client-logos.css'

export default function ClientLogos() {
  return <section className="client-logos" aria-labelledby="clients-title">
    <div className="client-logos-heading">
      <h3 id="clients-title"><strong className="client-logos-title">50+ 企業內訓與講座</strong>橫跨金融保險、零售通路與品牌、政府單位、媒體行銷、教育產業</h3>
    </div>
    <div className="client-logos-window" tabIndex={0} role="region" aria-label="曾授課企業與組織">
      <div className="client-logos-track">
        {[0, 1].map(copy => <ul className="client-logos-group" key={copy} aria-hidden={copy === 1 ? true : undefined}>
          {clients.map(client => <li className={`client-logo${client.monochrome ? ' client-logo--mono' : ''}`} key={client.name} title={client.name}>
            {client.file ? <div className="client-logo-artwork" style={{ '--logo-ratio': client.artwork.cropWidth / client.artwork.cropHeight }}>
              <img src={sitePath(`img/clients/${client.file}`)} alt={copy === 0 ? client.name : ''} decoding="async" draggable={false} style={{
                width: `${client.artwork.width / client.artwork.cropWidth * 100}%`,
                height: `${client.artwork.height / client.artwork.cropHeight * 100}%`,
                left: `${-client.artwork.x / client.artwork.cropWidth * 100}%`,
                top: `${-client.artwork.y / client.artwork.cropHeight * 100}%`,
              }}/>
              {client.monochrome && <img className="client-logo-color" src={sitePath(`img/clients/${client.file}`)} alt="" aria-hidden="true" decoding="async" draggable={false} style={{
                width: `${client.artwork.width / client.artwork.cropWidth * 100}%`,
                height: `${client.artwork.height / client.artwork.cropHeight * 100}%`,
                left: `${-client.artwork.x / client.artwork.cropWidth * 100}%`,
                top: `${-client.artwork.y / client.artwork.cropHeight * 100}%`,
              }}/>}
            </div> : <span>{client.name}</span>}
          </li>)}
        </ul>)}
      </div>
    </div>
  </section>
}
