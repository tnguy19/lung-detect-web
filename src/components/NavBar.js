import ThemeSwitcher from './ThemeSwitcher';

export default function NavBar({ onNavigate, activePage }) {
    return (
        <nav className="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="#" onClick={(e) => {
                    e.preventDefault();
                    onNavigate("home");
                }}>LungDetect</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor01" aria-controls="navbarColor01" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarColor01">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activePage === "home" ? "active" : ""}`} 
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate("home");
                                }}
                            >
                                Home
                                {activePage === "home" && <span className="visually-hidden">(current)</span>}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activePage === "features" ? "active" : ""}`} 
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate("features");
                                }}
                            >
                                Features
                                {activePage === "features" && <span className="visually-hidden">(current)</span>}
                            </a>
                        </li>
                        <li className="nav-item">
                            <a 
                                className={`nav-link ${activePage === "about" ? "active" : ""}`} 
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate("about");
                                }}
                            >
                                About
                                {activePage === "about" && <span className="visually-hidden">(current)</span>}
                            </a>
                        </li>
                    </ul>
                    <div className="d-flex">
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </nav>
    )
}