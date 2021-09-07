import $ from 'jquery'
import Store from '@/store'
import {crc32} from '@/utils'

function update() {
    const toc = $('#table-of-contents').html() || ''
    const hash = crc32(toc)

    if ($('#outline').data('hash') !== hash) {
        $('#outline').data('hash', hash)
        $('#outline').html(toc)
        Store.currentHeading.length && activate(Store.currentHeading.attr('id'))
    }

    $('#table-of-contents').remove()
}

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

$('#outline').on('click', 'li > a', function () {
    $('.heading-anchor[href="' + $(this).attr('href') + '"]').click()
    return false
})

export default {update, activate}
