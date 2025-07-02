const form = document.querySelector('#activity-form');
const activities = document.querySelector('#activities');
const activitiesSelect = document.querySelector('#activity-select');
const distance = document.querySelector('#distance');
const submitBtn = document.querySelector('#submit');
const category = document.querySelector('#category');

// edit options
let editElement;
let editFlag = false;
let editID = '';

form.addEventListener('submit', (e) => addActivity(e));

// clear items event listener btn

activitiesSelect.addEventListener('change', () => {
  const selectedOption =
    activitiesSelect.options[activitiesSelect.selectedIndex];
  const cat = selectedOption.parentElement.label;
  category.value = cat;
});

window.addEventListener('DOMContentLoaded', displayActivities);

function addActivity(e) {
  e.preventDefault();

  const activityValue = activitiesSelect.value;
  const distanceValue = Number(distance.value);
  const { icon, altText, units } = getIcon(category.value);
  const id = new Date().getTime().toString();

  const amount = calculateEmissions(category.value, distanceValue);

  if (activityValue && !editFlag) {
    createListItem(
      id,
      icon,
      altText,
      activityValue,
      distanceValue,
      units,
      amount,
      category.value
    );

    // add to local storage
    addToLocalStorage(
      id,
      icon,
      altText,
      activityValue,
      distanceValue,
      units,
      amount,
      category.value
    );
  } else if (activityValue && editFlag) {
    editElement.innerHTML = populateListItem(
      icon,
      altText,
      activityValue,
      distanceValue,
      units,
      amount,
      category.value
    );
    showNotification('Activity updated successfully', 'success');
    editLocalStorage(
      editID,
      icon,
      altText,
      activityValue,
      distanceValue,
      units,
      amount,
      category.value
    );
  } else {
    showNotification('Please select an activity', 'error');
  }

  resetForm();
}

function createListItem(
  id,
  icon,
  altText,
  activityValue,
  distanceValue,
  units,
  amount,
  category
) {
  const listItem = document.createElement('li');
  const attr = document.createAttribute('data-id');
  attr.value = id;
  listItem.setAttributeNode(attr);

  listItem.innerHTML = populateListItem(
    icon,
    altText,
    activityValue,
    distanceValue,
    units,
    amount,
    category
  );

  activities.appendChild(listItem);
  showNotification('Activity added successfully', 'success');

  const deleteBtn = listItem.querySelector('.delete-btn');
  const editBtn = listItem.querySelector('.edit-btn');

  deleteBtn.addEventListener('click', (e) => deleteActivity(e));
  editBtn.addEventListener('click', (e) => editActivity(e));
}

function populateListItem(
  icon,
  altText,
  activityValue,
  distanceValue,
  units,
  amount,
  category
) {
  return `<div class="left">
        <img src="./assets/${icon}" alt="${altText}">
        <span class="activity" data-category="${category}">${activityValue} - ${distanceValue}${units}</span>
      </div>

      <span class="co2-amount">${amount} kg CO<span class="symbol">2</span></span>

      <div class="right">
          <button type="button" class="edit-btn">
            <img src="./assets/check-square.svg" alt="edit-button">
          </button>
          <button type="button" class="delete-btn">
            <img src="./assets/trash.svg" alt="delete icon">
          </button>
      </div>
   `;
}

const notification = document.querySelector('.notification');

function showNotification(message, type) {
  notification.textContent = message;
  notification.classList.add(type);

  setTimeout(() => {
    notification.textContent = '';
    notification.classList.remove(type);
  }, 3000);
}

// ***** CALCULATE EMISSIONS *****
function getIcon(category) {
  switch (category) {
    case 'transport':
      return { icon: 'car.svg', altText: 'transport icon', units: ' km' };
    case 'food':
      return { icon: 'knife-fork.svg', altText: 'food icon', units: ' g' };
    case 'energy':
      return { icon: 'bolt.svg', altText: 'energy icon', units: ' kWh' };
  }
}

function calculateEmissions(category, amount) {
  const emissionFactors = {
    transport: 0.21,
    energy: 0.92,
    food: 0.027,
  };

  const factor = emissionFactors[category];
  if (!factor) {
    throw new Error('Invalid category');
  }

  const emissions = amount * factor;
  return emissions.toFixed(3);
}

// ***** LOCAL STORAGE FUNCTIONS *****
function getLocalStorage() {
  return localStorage.getItem('activities')
    ? JSON.parse(localStorage.getItem('activities'))
    : [];
}

function setLocalStorage(activities) {
  localStorage.setItem('activities', JSON.stringify(activities));
}

function addToLocalStorage(
  id,
  icon,
  altText,
  activityValue,
  distanceValue,
  units,
  amount,
  category
) {
  const activity = {
    id,
    icon,
    altText,
    activityValue,
    distanceValue,
    units,
    amount,
    category,
  };

  let activities = getLocalStorage();

  activities.push(activity);

  setLocalStorage(activities);
}

function removeFromLocalStorage(id) {
  let activities = getLocalStorage();
  activities = activities.filter((activity) => activity.id !== id);
  setLocalStorage(activities);
}

function resetForm() {
  activitiesSelect.value = '';
  distance.value = '';
  category.value = 'n/a';
  editFlag = false;
  editID = '';
  submitBtn.textContent = '+ Add Activity';
}

function editLocalStorage(
  id,
  icon,
  altText,
  activityValue,
  distanceValue,
  units,
  amount,
  category
) {
  let activities = getLocalStorage();

  const updatedActivities = activities.map((activity) => {
    if (activity.id === id) {
      return {
        id,
        icon,
        altText,
        activityValue,
        distanceValue,
        units,
        amount,
        category,
      };
    }
    return activity;
  });

  setLocalStorage(updatedActivities);
}

// ***** EDIT AND DELETE FUNCTIONS *****
function editActivity(e) {
  const element = e.currentTarget.parentElement.parentElement;
  const activity = element.querySelector('.activity');
  editElement = element;

  let currId = element.dataset.id;
  let [currActivity, currAmount] = activity.innerHTML.split(' - ');

  let currEmission = currAmount.match(/[\d.]+(?=\s*\w+)/)[0];

  activitiesSelect.value = currActivity;
  distance.value = Number(currEmission);
  category.value = activity.dataset.category;

  editFlag = true;
  editID = currId;
  submitBtn.textContent = 'Update Activity';
}

function deleteActivity(e) {
  const element = e.currentTarget.parentElement.parentElement;
  const id = element.dataset.id;
  activities.removeChild(element);

  // if (activities.children.length === 0) {
  //   // show p
  // }
  showNotification('Activity deleted successfully', 'success');
  resetForm();

  // remove from local storage
  removeFromLocalStorage(id);
}

function clearActivities() {
  const activitiesList = document.querySelectorAll('#activities li');

  if (activitiesList.length === 0) {
    showNotification('No activities to clear', 'error');
    return;
  }

  activitiesList.forEach((item) => {
    activities.removeChild(item);
  });

  // show p
  showNotification('All activities cleared', 'success');
  resetForm();
  // clear local storage
}

function displayActivities() {
  let activities = getLocalStorage();

  if (activities.length > 0) {
    activities.forEach((activity) => {
      const {
        id,
        icon,
        altText,
        activityValue,
        distanceValue,
        units,
        amount,
        category,
      } = activity;
      createListItem(
        id,
        icon,
        altText,
        activityValue,
        distanceValue,
        units,
        amount,
        category
      );
    });
  } else {
    // show p
    console.log('list empty');
  }
}