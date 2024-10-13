import React from 'react';
import './App.css';
import './firebase_config'; // Import config file

const Component: React.FC = () => {
  return (
    <div className="container">
      <h1 data-component="hello_world" className="rainbow-text">Hello World!</h1>
      <p data-component="paragraph">This is a new paragraph of text added to the component.</p>
    </div>
  );
};

export default Component;