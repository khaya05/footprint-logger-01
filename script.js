const form = document.querySelector('#activity-form');
const activity = document.querySelector('#activities');
const activityType = document.querySelector('#activity-select');
const distance = document.querySelector('#distance');
const addActivityBtn = document.querySelector('#submit');

// edit options
let editElement;
let editFlag = false;
let editID = '';

form.addEventListener('submit', (e) => addActivityBtn(e));


function addActivityBtn(e) {
  e.preventDefault();
  const activityValue = activityType.value;

  if (activityValue && !editFlag) {
    // add activity
  } else if (activityValue && editFlag) {
    // update activity
  } else {
    // update activity
  }
}