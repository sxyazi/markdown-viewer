import $ from 'jquery'

function activate(id) {
    const $ul = $('#outline > ul')
    const $li = $ul.find('a[href="#' + id + '"]').parent()

    // Cancel the activation first
    $ul.find('li').removeClass('active')
    // Activate current item
    $li.addClass('active')

    // Scroll to the top if the heading does not exist
    if ($li.length === 0) return $ul.animate({scrollTop: 0}, 100)

    // Calculate the suitable top offset
    // TODO: Refactoring
    const top = $li.offset().top - $ul.offset().top + $ul.scrollTop()
    if ((top > $ul.height() * .2 && top < $ul.scrollTop() + ($ul.height() * .2)) ||
        (top > $ul.scrollTop() + ($ul.height() * .8)))
        $ul.animate({scrollTop: top - ($ul.height() * .15)}, 100)
}

$('#outline').click(function (e) {
    if (this === e.target) {
        $(this).toggleClass('active')
        localStorage.setItem('ui:outline', $(this).hasClass('active') ? 'active' : 'inactive')
    }
})

export default {activate}
