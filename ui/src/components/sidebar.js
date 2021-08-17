import $ from 'jquery'
import Store from '@/store'
import {apiEndpoint} from '@/utils'

function scrollToFit() {
    const $files = $('#files')
    const $file = $files.find('li[path="' + Store.currentFile.path + '"]')
    const scrollTop = $file.offset().top - $files.offset().top + $files.scrollTop()

    if (scrollTop > $files.scrollTop() + $files.height()) {
        $files.animate({scrollTop: scrollTop}, 100)
    }
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

    const fileTemplate = $('#file-template').html()
    for (let i = 0; i < Store.allFiles.list.length; i++) {
        const file = $(fileTemplate)
        file.text(Store.allFiles.list[i].name)
        file.attr('path', Store.allFiles.list[i].path)
        file.attr('title', Store.allFiles.list[i].path)

        $('#files').append(file)
    }

    Store.openQueue()
})

export default {scrollToFit}
