// CONSTANTS 

const EMISSION_FACTORS = {
  transport: 0.21,
  energy: 0.92,
  food: 0.027,
};

const CATEGORY_CONFIG = {
  transport: { icon: 'car.svg', altText: 'transport icon', units: ' km' },
  food: { icon: 'knife-fork.svg', altText: 'food icon', units: ' g' },
  energy: { icon: 'bolt.svg', altText: 'energy icon', units: ' kWh' },
};

const NOTIFICATION_DURATION = 3000;

// DOM ELEMENTS

const DOM = {
  form: document.querySelector('#activity-form'),
  activities: document.querySelector('#activities'),
  activitiesSelect: document.querySelector('#activity-select'),
  distance: document.querySelector('#distance'),
  submitBtn: document.querySelector('#submit'),
  category: document.querySelector('#category'),
  noActivitiesP: document.querySelector('.no-activities'),
  notification: document.querySelector('.notification'),
};

// STATE

const state = {
  editElement: null,
  editFlag: false,
  editID: '',
};

// EVENT LISTENERS

function initializeEventListeners() {
  DOM.form.addEventListener('submit', handleFormSubmit);
  DOM.activitiesSelect.addEventListener('change', handleActivitySelectChange);
  window.addEventListener('DOMContentLoaded', displayActivities);
}

function handleFormSubmit(e) {
  e.preventDefault();
  addActivity();
}

function handleActivitySelectChange() {
  const selectedOption =
    DOM.activitiesSelect.options[DOM.activitiesSelect.selectedIndex];
  const category = selectedOption.parentElement.label;
  DOM.category.value = category;
}

// ACTIVITY MANAGEMENT

function addActivity() {
  const activityValue = DOM.activitiesSelect.value;
  const distanceValue = Number(DOM.distance.value);

  if (!activityValue) {
    showNotification('Please select an activity', 'error');
    return;
  }

  if (!distanceValue || distanceValue <= 0) {
    showNotification('Please enter a valid distance/amount', 'error');
    return;
  }

  try {
    const categoryConfig = getCategoryConfig(DOM.category.value);
    const id = generateId();
    const amount = calculateEmissions(DOM.category.value, distanceValue);

    const activityData = {
      id,
      ...categoryConfig,
      activityValue,
      distanceValue,
      amount,
      category: DOM.category.value,
    };

    if (state.editFlag) {
      updateActivity(activityData);
    } else {
      createActivity(activityData);
    }
  } catch (error) {
    console.error('Error adding activity:', error);
    showNotification('Error adding activity', 'error');
  }
}

function createActivity(activityData) {
  createListItem(activityData);
  addToLocalStorage(activityData);
  resetForm();
  hideNoActivities();
  showNotification('Activity added successfully', 'success');
}

function updateActivity(activityData) {
  state.editElement.innerHTML = populateListItem(activityData);

  attachListItemEventListeners(state.editElement);

  editLocalStorage(activityData);
  resetForm();
  showNotification('Activity updated successfully', 'success');
}

// DOM MANIPULATION

function createListItem(activityData) {
  const listItem = document.createElement('li');
  listItem.setAttribute('data-id', activityData.id);
  listItem.innerHTML = populateListItem(activityData);

  DOM.activities.appendChild(listItem);

  attachListItemEventListeners(listItem);
}

function populateListItem(activityData) {
  const {
    icon,
    altText,
    activityValue,
    distanceValue,
    units,
    amount,
    category,
  } = activityData;

  return `
    <div class="left">
      <img src="./assets/${icon}" alt="${altText}">
      <span class="activity" data-category="${category}">
        ${activityValue} - ${distanceValue}${units}
      </span>
    </div>
    <span class="co2-amount">
      ${amount} kg CO<span class="symbol">2</span>
    </span>
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

function attachListItemEventListeners(listItem) {
  const deleteBtn = listItem.querySelector('.delete-btn');
  const editBtn = listItem.querySelector('.edit-btn');

  deleteBtn.addEventListener('click', handleDeleteActivity);
  editBtn.addEventListener('click', handleEditActivity);
}

// EDIT & DELETE FUNCTIONALITY

function handleEditActivity(e) {
  const element = e.currentTarget.parentElement.parentElement;
  const activity = element.querySelector('.activity');

  state.editElement = element;
  state.editID = element.dataset.id;
  state.editFlag = true;

  const [currActivity, currAmountText] = activity.innerHTML.trim().split(' - ');
  const currAmount = parseFloat(currAmountText.match(/[\d.]+/)[0]);

  DOM.activitiesSelect.value = currActivity;
  DOM.distance.value = currAmount;
  DOM.category.value = activity.dataset.category;
  DOM.submitBtn.textContent = 'Update Activity';
}

function handleDeleteActivity(e) {
  const element = e.currentTarget.parentElement.parentElement;
  const id = element.dataset.id;

  DOM.activities.removeChild(element);

  removeFromLocalStorage(id);

  if (DOM.activities.children.length === 0) {
    showNoActivities();
  }

  showNotification('Activity deleted successfully', 'success');
  resetForm();
}

function getCategoryConfig(category) {
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    throw new Error(`Invalid category: ${category}`);
  }
  return config;
}

function calculateEmissions(category, amount) {
  const factor = EMISSION_FACTORS[category];
  if (!factor) {
    throw new Error(`Invalid category: ${category}`);
  }

  const emissions = amount * factor;
  return emissions.toFixed(3);
}

function generateId() {
  return new Date().getTime().toString();
}

function resetForm() {
  DOM.activitiesSelect.value = '';
  DOM.distance.value = '';
  DOM.category.value = 'n/a';
  DOM.submitBtn.textContent = '+ Add Activity';

  state.editFlag = false;
  state.editID = '';
  state.editElement = null;
}

// NOTIFICATION

function showNotification(message, type) {
  DOM.notification.textContent = message;
  DOM.notification.classList.add(type);

  setTimeout(() => {
    DOM.notification.textContent = '';
    DOM.notification.classList.remove(type);
  }, NOTIFICATION_DURATION);
}

// LOCAL STORAGE 

function getLocalStorage() {
  try {
    const data = localStorage.getItem('activities');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

function setLocalStorage(activities) {
  try {
    localStorage.setItem('activities', JSON.stringify(activities));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    showNotification('Error saving data', 'error');
  }
}

function addToLocalStorage(activityData) {
  const activities = getLocalStorage();
  activities.push(activityData);
  setLocalStorage(activities);
}

function removeFromLocalStorage(id) {
  const activities = getLocalStorage();
  const filteredActivities = activities.filter(
    (activity) => activity.id !== id
  );
  setLocalStorage(filteredActivities);
}

function editLocalStorage(activityData) {
  const activities = getLocalStorage();
  const updatedActivities = activities.map((activity) => {
    return activity.id === activityData.id ? activityData : activity;
  });
  setLocalStorage(updatedActivities);
}

// DISPLAY FUNCTIONS

function displayActivities() {
  const activities = getLocalStorage();

  if (activities.length > 0) {
    activities.forEach((activity) => {
      createListItem(activity);
    });
    hideNoActivities();
  } else {
    showNoActivities();
  }
}

function showNoActivities() {
  DOM.noActivitiesP.classList.remove('none');
}

function hideNoActivities() {
  DOM.noActivitiesP.classList.add('none');
}


function clearActivities() {
  const activitiesList = document.querySelectorAll('#activities li');

  if (activitiesList.length === 0) {
    showNotification('No activities to clear', 'error');
    return;
  }

  activitiesList.forEach((item) => {
    DOM.activities.removeChild(item);
  });

  setLocalStorage([]);

  showNoActivities();
  showNotification('All activities cleared', 'success');
  resetForm();
}

// INITIALIZATION

function init() {
  initializeEventListeners();
  displayActivities();
}

init();
