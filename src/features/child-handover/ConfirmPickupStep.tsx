import "./ConfirmPickupStep.css";
import {Baby, IdCard} from "lucide-react";
import { FaLockOpen } from "react-icons/fa";
import { FaCircleCheck } from "react-icons/fa6";

export const ConfirmPickupStep = () => {
  const adult = {
    name: "Ricardo Mendoza",
    relation: "ABUELO",
    verified: true,
    initials: "RM",
    icon: IdCard
  };


  return (
    <div className="confirm-layout">
      <div className="card">
        <div className="confirmation-circle">
          <FaCircleCheck color="#2f9053" size={50}/>
        </div>
        <h2>¡Autorización Registrada con Éxito!</h2>
        <p>
          Los datos biométricos han sido comprobados de forma segura y con exito,
          se autoriza la salida del menor.
        </p>
        <div className="data">

          {/* Columna izquierda - Datos del niño */}
          <div className="kids-column">
            <div className="header-column">
              <div className="icon-wrapper">
                <Baby size={26} strokeWidth={2.50}/>
              </div>
              <p>Niños a retirarse</p>
            </div>

            {/* Datos niños a retirarse de prubea */}
            <div className="list-kids-scroll">
              <div className="list-kids">
                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>

                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>

                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>

                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>

                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>


                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>


                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>

                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>


                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>


                <div className="kid-data-container">
                  <div className="avatar-kid">SG</div>
                  <div className="kid-details">
                    <h3>Sofia Gonzalez</h3>
                    <p>Grupo: Ositos(3 años)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Datos del niño */}
          <div className="responsible-adult-column">
            <div className="header-column">
              <div className="icon-wrapper">
                <IdCard size={30} strokeWidth={2}/>
              </div>
              <p>Adulto responsable</p>
            </div>
            <div className="adult-info">
              <div className="avatar">{adult.initials}</div>
              <div className="adult-details">
                <h3>{adult.name}</h3>
                <div className="relation-details">
                  <p className="relation">{adult.relation}</p>
                  <div className="verification">
                    <FaCircleCheck color="#10b981"/>
                    <p>Verificado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Banner de confirmacion */}
            <div className="confirmation-banner">
              <FaLockOpen color="#10b981" size={18}/>
              <p className="authorized-text">Autorizado para recogida</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
