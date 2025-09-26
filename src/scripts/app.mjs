import { MissingPerson } from "./models/MissingPerson.mjs";

let missingPersons = [];
let photos = [
  '/icons/missing_person_01.jpeg',
  '/icons/missing_person_02.jpeg',
  '/icons/missing_person_03.jpeg',
  '/icons/missing_person_04.jpeg'
];

loadFromLocalStorage();
renderList();

const form = document.getElementById("missing-form");
const listContainer = document.getElementById("missing-list");
document.addEventListener("DOMContentLoaded", () => {
  const btnSave = document.getElementById("btn-save");
  btnSave.addEventListener("click", () => {
    console.log("Botón guardar presionado");
    addMissingPerson();
    form.reset();
  });
});

const saveToLocalStorage = () => {
  localStorage.setItem("missingPersons", JSON.stringify(missingPersons));
};

const loadFromLocalStorage = () => {
  const data = localStorage.getItem("missingPersons");
  if (data) {
    missingPersons = JSON.parse(data).map(p => {
      const person = new MissingPerson(
        p.name,
        p.age,
        p.gender,
        p.description,
        p.date_disappearance
      );
      person.photo = p.photo;
      return person;
    });
  }
};

const addMissingPerson = () => {
  const name = document.getElementById("input-name").value;
  const age = document.getElementById("input-age").value;
  const gender = document.getElementById("input-gender").value;
  const description = document.getElementById("input-description").value;
  const date_disappearance = document.getElementById("input-date").value;

  if (name && age && gender && description && date_disappearance) {
    const missingPerson = new MissingPerson(
      name,
      age,
      gender,
      description,
      date_disappearance
    );

    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
    missingPerson.photo = randomPhoto;

    missingPersons.push(missingPerson);
    saveToLocalStorage();
    renderList();
  }
};

const renderList = () => {
  listContainer.innerHTML = "";
  missingPersons.forEach((person, index) => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <img src="${person.photo}" alt="Foto de ${person.name}">
      <h3>${person.name}, ${person.age}</h3>
      <p><b>Género:</b> ${person.gender}</p>
      <p><b>Descripción:</b> ${person.description}</p>
      <p><b>Desapareció el:</b> ${person.date_disappearance}</p>
      <button onclick="deleteMissingPerson(${index})">Eliminar</button>
    `;

    listContainer.appendChild(card);
  });
};

window.deleteMissingPerson = (index) => {
  missingPersons.splice(index, 1);
  saveToLocalStorage();
  renderList();
};