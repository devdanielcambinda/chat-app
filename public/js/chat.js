const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('#message')
const $messageFormButton = $messageForm.querySelector('#submitButton')
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector('#messages')


//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML;

//Options
const { username, room }  = Qs.parse(location.search, {ignoreQueryPrefix: true})

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format('MMM Do, YYYY - HH:mm')
  });
  $messages.insertAdjacentHTML('beforeend',html)
})

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("MMM Do, YYYY - HH:mm"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener('submit',(e)=>{
  e.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled"); //disable the form

  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {

    $messageFormButton.removeAttribute("disabled") //re-enable button
    $messageFormInput.value = '' //reset text input
    $messageFormInput.focus() //set focus to text input 

    if (error) {
      return console.log(error);
    }

    console.log("Delivered");
  });
})

document.querySelector('#send-location').addEventListener('click', (e)=>{
    
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position)=>{

        
        socket.emit('sendLocation', {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }, ()=>{
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.emit('join', {username, room}, (error)=>{
  if(error){
    alert(error)
    location.href='/'
  }
} )
