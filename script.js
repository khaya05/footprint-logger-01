const form = document.querySelector('#activity-form');
const activity = document.querySelector('#activities');
const activityType = document.querySelector('#activity-select');
const distance = document.querySelector('#distance');
const addActivityBtn = document.querySelector('#submit');

console.log(activityType);

// Function to create a new activity element

// get values from the form

addActivityBtn.addEventListener('click', (e) => {
  e.preventDefault();

  const activityTypeValue = activityType.value;
  const distanceValue = distance.value;

  console.log('Activity Type:', activityTypeValue);
  console.log('Distance:', distanceValue);
});
