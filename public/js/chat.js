//-----------Client side-----------
const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $allMessages = document.querySelector('#messages')

//Templates
const msgTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username , room} = Qs.parse(location.search , {ignoreQueryPrefix: true})

//AutoScroll
const autoscroll = () => {
    // New message element
    const $newMessage = $allMessages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $allMessages.offsetHeight

    // Height of messages container
    const containerHeight = $allMessages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $allMessages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $allMessages.scrollTop = $allMessages.scrollHeight
    }
}

//Socket Event Listner
socket.on('message' , (message) =>{
    console.log(message)

    const storeHtml = Mustache.render(msgTemplate , {
        username: message.username ,
        getMessage: message.text ,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $allMessages.insertAdjacentHTML('beforeend' , storeHtml)
    autoscroll()
})

socket.on('locationMessage' , (msgurl) =>{
    const storeHtml = Mustache.render(locationTemplate ,{
        username: msgurl.username ,
        url: msgurl.url ,
        createdAt: moment(msgurl.createdAt).format('h:mm a')
    })
    $allMessages.insertAdjacentHTML('beforeend' , storeHtml)
    console.log(msgurl)
    autoscroll()
})

socket.on('roomData' ,({room,users}) =>{
    const html = Mustache.render(sidebarTemplate ,{
        room : room,
        users: users
    })
    document.querySelector('#sidebar').innerHTML = html
})

//------------Form query------------
$messageForm.addEventListener('submit' ,(e)=>{
    e.preventDefault() //preventing from page refresh after submit

    $messageFormButton.setAttribute('disabled' , 'disabled') // Disabling button

    const msg = e.target.elements.message.value // Getting input value
    
    socket.emit('sendMessage' , msg ,(getMessage)=>{
        $messageFormButton.removeAttribute('disabled') // Enable button
        $messageFormInput.value = ''
        $messageFormInput.focus()
        console.log('Message Sent!! ' , getMessage)
    })
})

//------------Location query-----------
$sendLocationButton.addEventListener('click' , () =>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled' , 'disabled') //Disable Button

    navigator.geolocation.getCurrentPosition((position)=>{
        share = {
            lat: position.coords.latitude ,
            long: position.coords.longitude
        }
        
        socket.emit('sendLocation' , share ,()=>{
            $sendLocationButton.removeAttribute('disabled')  //Enable Button
            console.log("Location send!!")
        })
    })

})

socket.emit('join' , {username , room} ,(error)=>{
    if(error){
        alert(error)
        location.href='/'
    }
})

// socket.on('Updated' , (count) =>{
//     console.log('Count value ' , count)
// })

// document.querySelector('#increment').addEventListener('click' ,()=>{
//     console.log('Clicked')

//     socket.emit('increment')
// })