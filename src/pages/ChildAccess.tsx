import "./ChildAccess.css";

export default function ChildAccess() {
    return (
        <div className="page">
            <section className="hero">
                <h1>Control de Entradas y Salidas</h1>
                <p>¿Que accion desea realizar?</p>
            </section>

            <section className="action-buttons">
                <div className="cards">
                    <div className="btn ingreso">
                        <h2>Ingresar al menor</h2>
                        <p>Registrar ingreso del niño a la guarderia</p>
                    </div>

                    <div className="btn salida">
                        <h2>Entregar al menor</h2>
                        <p>Registrar salida segura del niño</p>
                    </div>
                </div>
            </section>
        </div>
    );
}