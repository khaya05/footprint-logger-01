// CONSTANTS

const EMISSION_FACTORS = {
  transport: {
    'Bus Ride': 0.1,
    'Drive Car': 0.21,
    Flight: 0.255,
  },
  food: {
    'Eat Beef': 27.0,
    'Eat Chicken': 6.9,
    'Eat Vegetables': 2.0,
  },
  energy: {
    'Use Electricity': 0.92,
    'Boil Water': 0.06,
    'Electric Heater': 1.5,
    'Hot Shower': 1.0,
  },
};

const CATEGORY_CONFIG = {
  transport: {
    icon: 'car.svg',
    altText: 'transport icon',
    units: ' km',
    label: 'Distance (km)',
  },
  food: {
    icon: 'knife-fork.svg',
    altText: 'food icon',
    units: ' Kg',
    label: 'Weight (Kg)',
  },
  energy: {
    icon: 'bolt.svg',
    altText: 'energy icon',
    units: ' kWh',
    label: 'Energy (kWh)',
  },
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
  distanceLabel: document.querySelector('label[for="distance"]'),
  filters: document.querySelector('.filters'),
};

// STATE

const state = {
  editElement: null,
  editFlag: false,
  editID: '',
  currentFilter: 'All',
};

// EVENT LISTENERS

function initializeEventListeners() {
  DOM.form.addEventListener('submit', handleFormSubmit);
  DOM.activitiesSelect.addEventListener('change', handleActivitySelectChange);
  window.addEventListener('DOMContentLoaded', displayActivities);

  [...DOM.filters.children].forEach((btn) =>
    btn.addEventListener('click', (e) => filterActivities(e))
  );
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

  updateDistanceLabel(category);
}

function updateDistanceLabel(category) {
  const config = CATEGORY_CONFIG[category];
  if (config && DOM.distanceLabel) {
    DOM.distanceLabel.innerHTML = `${config.label}:
      <input
        type="number"
        id="distance"
        name="distance"
        min="0"
        step="0.1"
      />`;

    DOM.distance = document.querySelector('#distance');
  }
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
    const id = state.editFlag ? state.editID : generateId();
    const amount = calculateEmissions(
      activityValue,
      DOM.category.value,
      distanceValue
    );

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

  const filteredActivities = getFilteredActivities();
  updateChartWithData(filteredActivities);
  showNotification('Activity added successfully', 'success');
}

function updateActivity(activityData) {
  state.editElement.innerHTML = populateListItem(activityData);

  attachListItemEventListeners(state.editElement);

  editLocalStorage(activityData);

  const filteredActivities = getFilteredActivities();
  updateChartWithData(filteredActivities);
  resetForm();
  showNotification('Activity updated successfully', 'success');
}

function filterActivities(e) {
  const btns = [...DOM.filters.children];
  btns.forEach((btn) => {
    btn.classList.remove('active');
    if (btn === e.currentTarget) {
      btn.classList.add('active');
    }
  });

  state.currentFilter = e.currentTarget.textContent;

  const filteredActivities = getFilteredActivities();

  updateChartWithData(filteredActivities);
  displayActivities(filteredActivities);
}

function getFilteredActivities() {
  const activities = getLocalStorage();

  if (state.currentFilter === 'All') {
    return activities;
  }

  return activities.filter((activity) => {
    return activity.category === state.currentFilter.toLowerCase();
  });
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
    <div class="right">
      <span class="co2-amount">
        ${amount} kg CO<span class="symbol">2</span>
      </span>
      <div class="btn-container">
        <button type="button" class="edit-btn">
          <img src="./assets/check-square.svg" alt="edit-button">
        </button>
        <button type="button" class="delete-btn">
          <img src="./assets/trash.svg" alt="delete icon">
        </button>
      </div>
    </div>
  `;
}

function attachListItemEventListeners(listItem) {
  const deleteBtn = listItem.querySelector('.delete-btn');
  const editBtn = listItem.querySelector('.edit-btn');

  deleteBtn.addEventListener('click', handleDeleteActivity);
  editBtn.addEventListener('click', handleEditActivity);
}

function scrollTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

// EDIT & DELETE FUNCTIONALITY

function handleEditActivity(e) {
  scrollTop();
  const element = e.currentTarget.parentElement.parentElement.parentElement;
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

  updateDistanceLabel(activity.dataset.category);
}

function handleDeleteActivity(e) {
  const element = e.currentTarget.parentElement.parentElement.parentElement;
  console.log('Deleting activity:', element);
  const id = element.dataset.id;

  DOM.activities.removeChild(element);

  removeFromLocalStorage(id);

  if (DOM.activities.children.length === 0) {
    showNoActivities();
  }

  scrollTop();
  showNotification('Activity deleted successfully', 'success');

  const filteredActivities = getFilteredActivities();
  updateChartWithData(filteredActivities);
  resetForm();
}

function getCategoryConfig(category) {
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    throw new Error(`Invalid category: ${category}`);
  }
  return config;
}

function calculateEmissions(activity, category, amount) {
  const factor = EMISSION_FACTORS[category][activity];
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

  if (DOM.distanceLabel) {
    DOM.distanceLabel.innerHTML = `Amount:
      <input
        type="number"
        id="distance"
        name="distance"
        min="0"
        step="0.1"
      />`;

    DOM.distance = document.querySelector('#distance');
  }
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

function displayActivities(activities) {
  clearActivities();
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

  activitiesList.forEach((item) => {
    DOM.activities.removeChild(item);
  });
}

function getTotals(activities = null) {
  const activitiesData = activities || getLocalStorage();
  const totals = {
    transport: 0,
    energy: 0,
    food: 0,
  };

  activitiesData.forEach((activity) => {
    totals[activity.category] += parseFloat(activity.amount);
  });

  return totals;
}

// CHART
let chart;

function getLabels(activities = null) {
  const totals = getTotals(activities);
  return Object.keys(totals).filter((category) => totals[category] > 0);
}

function getTotalEmissions(activities = null) {
  const totals = getTotals(activities);
  return Object.values(totals).reduce((a, b) => a + b, 0);
}

function createChart(ctx) {
  const data = {
    labels: getLabels(),
    datasets: [
      {
        data: Object.values(getTotals()),
        label: 'Carbon Footprint (kg CO2)',
        backgroundColor: ['#137113ff', '#4cae4f', '#b1f2b1ff'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw(chart) {
      const { width, height, ctx } = chart;
      const total = getTotalEmissions(getFilteredActivities()) || 0;

      ctx.restore();
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.font = 'bold 18px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#333';
      ctx.fillText(`${total.toFixed(3)} kg`, centerX, centerY - 10);

      ctx.font = '14px Poppins, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('CO₂', centerX, centerY + 12);

      ctx.save();
    },
  };

  return new Chart(ctx, {
    type: 'doughnut',
    data,
    options,
    plugins: [centerTextPlugin],
  });
}

function updateChartWithData(activities) {
  if (!chart) return;

  const totals = getTotals(activities);
  const newData = Object.values(totals);
  const newLabels = getLabels(activities);

  chart.data.datasets[0].data = newData;
  chart.data.labels = newLabels;
  chart.update();
}

function updateChart() {
  const filteredActivities = getFilteredActivities();
  updateChartWithData(filteredActivities);
}

// INITIALIZATION

function init() {
  initializeEventListeners();
  displayActivities(getLocalStorage());

  const ctx = document.querySelector('#carbonChart');
  if (ctx) {
    chart = createChart(ctx.getContext('2d'));
  }
}

window.addEventListener('DOMContentLoaded', init);
