import React from 'react';
import Navbar from '../NavBar/Navbar'

const Layout: React.FC = ({ children }) => {
    return (
        <>
            {<Navbar />}
            <main>{children}</main>
        </>
    )

}
export default Layout;