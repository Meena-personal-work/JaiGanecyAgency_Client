/* eslint-disable no-unused-vars */
import React from "react";
import "./Card.scss";

// eslint-disable-next-line react/prop-types
const Card = ({ name, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <h2>{name}</h2>
    </div>
  );
};

export default Card;
