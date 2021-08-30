import $ from 'jquery'
import Store from '@/store'
import {apiEndpoint, clone, groupFiles} from '@/utils'

function activate(path) {
    const $files = $('#files')
    const $file = $files.find('li[path="' + path + '"]')

    // Activate current item
    $files.find('li').removeClass('active')
    $files.find('li+ul').css('display', 'none')
    $file.addClass('active')
    $file.parent().css('display', 'block')
    $file.next('ul').css('display', 'block')

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
        Store.allFiles = {list: []}
    }

    const groupedFiles = groupFiles(clone(Store.allFiles))
    const createFileElem = (file) => {
        const $file = $('<li/>')
        $file.attr('path', file.path)
        $file.attr('title', file.path)
        $file.attr('type', file.children ? 'directory' : 'general')
        $file.append($('<span/>').text(file.name))
        return $file
    }

    const $files = $('#files')
    for (let file of groupedFiles.list) {
        $files.append(createFileElem(file))

        if (file.children) {
            const $sub = $('<ul/>')
            for (let child of file.children)
                $sub.append(createFileElem(child))

            $files.append($sub)
        }
    }

    Store.openQueue()
})

export default {activate}
