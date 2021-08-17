import $ from 'jquery'

$('#outline').click(function (e) {
    if (this === e.target) {
        $(this).toggleClass('active')
        localStorage.setItem('ui:outline', $(this).hasClass('active') ? 'active' : 'inactive')
    }
})

export default {}
