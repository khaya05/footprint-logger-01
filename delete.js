activitiesSelect.addEventListener('change', () => {
  const selectedOption =
    activitiesSelect.options[activitiesSelect.selectedIndex];
  const cat = selectedOption.parentElement.label;
  category.value = cat;
  const inputLabel = document.querySelector('label[for=distance]');

  switch (cat) {
    case 'food':
      inputLabel.innerHTML = getLabel('Weight (g):');
      break;
    case 'energy':
      inputLabel.innerHTML = getLabel('Amount (KWh):');
      break;
    default:
      inputLabel.innerHTML = getLabel('Distance (km):');
  }
});

function getLabel(label) {
  return `
    ${label}
    <input
      type="number"
      id="distance"
      name="distance"
      min="0"
      step="0.1"
      required
    />
  `;
}
