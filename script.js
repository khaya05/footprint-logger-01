const form = document.querySelector('#activity-form');
const activities = document.querySelector('#activities');
const activityType = document.querySelector('#activity-select');
const distance = document.querySelector('#distance');
const submitBtn = document.querySelector('#submit');
const category = document.querySelector('#category');

// edit options
let editElement;
let editFlag = false;
let editID = '';

form.addEventListener('submit', (e) => addActivity(e));

// clear items event listener
//

function addActivity(e) {
  e.preventDefault();
  const activityValue = activityType.value;
  const distanceValue = Number(distance.value);
  const { icon, altText, units } = getIcon(category.value);
  const id = new Date().getTime().toString();

  const amount = calculateEmissions(category.value, distanceValue);

  console.log({
    amount,
    category: category.value,
    distanceValue,
    activityValue,
    icon,
    altText,
    units,
  });

  if (activityValue && !editFlag) {
    const listItem = document.createElement('li');
    const attr = document.createAttribute('data-id');
    attr.value = id;
    listItem.setAttributeNode(attr);

    listItem.innerHTML = `<div class="left">
        <img src="./assets/${icon}" alt="${altText}">
        <span class="activity">${activityValue} - <span class="amount"> ${distanceValue}${units}</span></span>
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

    activities.appendChild(listItem);
    showNotification('Activity added successfully', 'success');

    const deleteBtn = listItem.querySelector('.delete-btn');
    const editBtn = listItem.querySelector('.edit-btn');

    deleteBtn.addEventListener('click', (e) => deleteActivity(e));
    editBtn.addEventListener('click', (e) => editActivity(e));

    // add to local storage
    // addToLocalStorage(id, )

    // reset form
    resetForm();
  } else if (activityValue && editFlag) {
    // update activity
    console.log('update activity');
  } else {
    showNotification('Please select an activity', 'error');
  }
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
      return { icon: 'car.svg', altText: 'Car icon', units: ' km' };
    case 'food':
      return { icon: 'knife-fork.svg', altText: 'Food icon', units: ' g' };
    case 'energy':
      return { icon: 'bolt.svg', altText: 'Energy icon', units: ' kWh' };
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
function addToLocalStorage(id, activity) {
  console.log('saved to local storage');
}

function removeFromLocalStorage(id) {
  console.log('removed from local storage');
}

function resetForm() {
  activityType.value = '';
  distance.value = '';
  category.value = 'n/a';
  editFlag = false;
  editID = '';
  submitBtn.textContent = '+ Add Activity'
}

// ***** EDIT AND DELETE FUNCTIONS *****
function editActivity(e) {
  const element = e.currentTarget.parentElement.parentElement;
  let currId = element.dataset.id;
  let [currActivity, amountInput] = element
    .querySelector('.activity')
    .innerHTML.split(' - ');

  let currEmission = element
    .querySelector('.amount')
    .innerHTML.match(/[\d.]+(?=\s*\w+)/)[0];

  activityType.value = currActivity;
  distance.value = Number(currEmission);

  editFlag = true;
  editID = currId;
  submitBtn.textContent = 'Update Activity'
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