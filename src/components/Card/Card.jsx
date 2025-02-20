import React from "react";
import "./Card.scss";

const Card = ({ name, onClick }) => {
  return (
    <div className="card" onClick={onClick}>
      <h2>{name}</h2>
    </div>
  );
};

export default Card;
