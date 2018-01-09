const hide = function() {
  document.getElementById('animated').style.visibility = 'hidden';
  setTimeout(show, 1000);
};

const show = function() {
  document.getElementById('animated').style.visibility = 'visible';
};
