import $ from 'jquery'
import Store from '@/store'
import {apiEndpoint} from '@/utils'

function activate(path) {
    const $files = $('#files')
    const $file = $files.find('li[path="' + path + '"]')

    // Activate current item
    $files.find('li').removeClass('active')
    $file.addClass('active')

    // Calculate the suitable top offset
    const top = $file.offset().top - $files.offset().top + $files.scrollTop()
    if (top > $files.scrollTop() + $files.height())
        $files.animate({scrollTop: top}, 100)
}

$('#switch').click(() => {
    const $aside = $('aside')
    if ($aside.width() >= 16)
        $aside.removeClass('unfold').addClass('fold')
    else
        $aside.removeClass('fold').addClass('unfold')

    localStorage.setItem('ui:sidebar', $aside.hasClass('fold') ? 'inactive' : 'active')
})

$('#files').on('click', 'li', function () {
    Store.open($(this).attr('path'))
})

$.get(apiEndpoint('files'), function (files) {
    try {
        Store.allFiles = JSON.parse(files)
    } catch (e) {
        Store.allFiles = {}
    }

    for (let i = 0; i < Store.allFiles.list.length; i++) {
        const file = $('<li/>')
        file.text(Store.allFiles.list[i].name)
        file.attr('path', Store.allFiles.list[i].path)
        file.attr('title', Store.allFiles.list[i].path)

        $('#files').append(file)
    }

    Store.openQueue()
})

export default {activate}
