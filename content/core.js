/*
Company: Sixty AS
Author: Mahdi rouzbahaneh
2021/03/17
*/

// #region general //

function isEmpty(value) {
    return (
        (value == null) ||
        (value.hasOwnProperty('length') && value.length === 0) ||
        (value.constructor === Object && Object.keys(value).length === 0)
    )
}

function minToTime(min) {
    return Math.floor(min / 60) + ' time ' + min % 60 + ' min';
}

function spin(show) {
    let num = $('img.spin').prop('num');
    num = num == undefined ? 0 : num;
    if (show)
        num++;
    else
        num--;
    num = num < 0 ? 0 : num;
    $('img.spin').css('display', num == 0 ? 'none' : 'block');
    $('img.spin').prop('num', num);
}

(function ($) {
    $.fn.isInViewport = function () {
        var elementTop = $(this).offset().top;
        var elementBottom = elementTop + $(this).outerHeight();

        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();

        return elementBottom > viewportTop && elementTop < viewportBottom;
    };
}(jQuery));

(function ($) {
    $.fn.scrollToMiddle = function () {
        let settings = $.extend({
            duration: 100
        });
        let offset;
        if ($(this).height() < $(window).height()) {
            offset = $(this).offset().top - (($(window).height() / 2) - ($(this).height() / 2));
        } else {
            offset = $(this).offset().top;
        }
        $('html, body').animate({
            scrollTop: offset
        }, settings.duration);
    };
}(jQuery));

(function ($) {
    $.fn.disableSelection = function () {
        return this
            .attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart dragstart', false);
    };
})(jQuery);

// #endregion general //

// #region OptionBar //

(function ($) {

    $.fn.OptionBar = function (settings) {
        if (settings == undefined)
            return;
        if (settings.id == undefined)
            return;

        if (settings.selectList == undefined)
            settings.selectList = [];

        if (settings.selected == undefined && settings.selectList.length != 0)
            settings.selected = settings.selectList[0];

        $(this).prop('selectList', JSON.stringify(settings.selectList));

        let options = "";
        let template = [
            '<li item-index="{{index}}" item-id="{{item.id}}" tabindex="{{index}}">',
            '<input id="{{id}}" type="radio" name="{{settings.id}}">',
            '<label for="{{id}}" unselectable="on">{{item.text}}</label></li>',
        ].join('');
        $.each(settings.selectList, function (index, item) {
            let id = settings.id + '-' + item.id + '-' + index;
            options += Mustache.render(template, { index: index, item: item, id: id, settings: settings });
        });
        $(this)[0].innerHTML = '<ul id="' + settings.id + '" class="option-bar">' + options + '</ul>';

        $(this).find('input[item-id="' + settings.selected.id + '"]').prop('checked', 'checked');
        $(this).prop('selected', JSON.stringify(settings.selected));
        $(this).prop('selectedIndex', settings.selectList.findIndex(x => x.id = settings.selected.id));

        $(this).find('label').on('selectstart dragstart', false);

        $(document).on('click', '#' + settings.id + '.option-bar li', { id: settings.id }, function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            let optionBar = $(this).closest('.option-bar');
            let parent = $(optionBar).parent();
            let selectList = JSON.parse($(parent).prop('selectList'));
            if (selectList == undefined)
                return;

            let li = $(this);
            if (!$(li).is('li'))
                li = $(this).closest('li');

            $(optionBar).find('li').removeClass('selected');
            $(li).addClass('selected');
            $(optionBar).find('div.right-arrow').remove();
            $(li).append('<div class="right-arrow"></div>');
            $(li).focus();

            let selected = selectList[Number($(li).attr('item-index'))];
            $(parent).prop('selected', JSON.stringify(selected));
            $(parent).prop('selectedIndex', $(li).attr('item-index'));
            $(parent).trigger('change', { action: 'change', selected: selected, selectList: selectList });
        });
    };

}(jQuery));

// #endregion OptionBar //

// #region ImageGrid //

(function ($) {

    $.fn.ImageGrid = function (settings) {
        if (settings == undefined)
            return;
        if (settings.id == undefined)
            return;

        if (settings.selectList == undefined)
            settings.selectList = [];

        $(this).prop('selectList', JSON.stringify(settings.selectList));

        let template = '<input type="image" item-index="{{index}}" item-id="{{item.id}}" src="{{item.src}}" tabindex="{{index}}"/>';

        if (settings.append == true) {
            if ($(this).find('div#' + settings.id).length == 0) {
                $(this)[0].innerHTML = '<div id="' + settings.id + '" class="image-grid"></div>';
            }
            let div = $(this).find('div#' + settings.id)[0];
            let oldCount = $(this).find('input').length;
            for (index = oldCount; index < settings.selectList.length; index++) {
                let item = settings.selectList[index];
                div.insertAdjacentHTML('beforeend', Mustache.render(template, { index: index, item: item }));
            }
        } else {
            let images = '';
            $.each(settings.selectList, function (index, item) {
                images += Mustache.render(template, { index: index, item: item });
            });
            $(this)[0].innerHTML = '<div id="' + settings.id + '" class="image-grid">' + images + '</div>';
        }


        $(document).on('click', '#' + settings.id + ' input', { id: settings.id }, function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            let imageGrid = $(this).closest('.image-grid');
            let parent = $(imageGrid).parent();
            let selectList = JSON.parse($(parent).prop('selectList'));
            if (selectList == undefined)
                return;

            let selected = selectList[Number($(this).attr('item-index'))];
            $(parent).prop('selected', JSON.stringify(selected));
            $(parent).trigger('change', { action: 'click', selected: selected, selectList: selectList });
        });
    };

}(jQuery));

// #endregion ImageGrid //
