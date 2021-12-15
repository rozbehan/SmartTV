/*
Company: Sixty AS
Author: Mahdi rouzbahaneh
2021/03/17
*/

$(document).ready(function () {

// #region model //

    (function (testSixty) {
        var dataInfo = {
            api_url: 'https://api.themoviedb.org/3',
            image_url: 'https://image.tmdb.org/t/p/w500',
            api_key: '889abe3247f9348a43ba33d2c9270735',
            api: {
                genreList: '/genre/movie/list',
                movieList: '/discover/movie',
                movieDetail: '/movie',
            },
            language: 'en-US',
            genreList: [],
            movieList: {},

            //methods
            getGenreList: {},
            getMovieList: {},
            getMovieDetail: {},
        };

        testSixty.getData = function () {
            return dataInfo;
        }
    }(window.testSixty = {}));

// #endregion model //

//-------------------------------------------------------------------------------------//

// #region controller //

    (function (testSixty) {
        var dataInfo = testSixty.getData()
        const detail_NC = 'detail_1336'; //a non-conflict field name to hold detail next to main data

        dataInfo.getGenreList = async function (callback) {
            if (dataInfo.genreList.length == 0) {
                let result = await apiGet('genreList', { api_key: dataInfo.api_key, language: dataInfo.language });
                dataInfo.genreList = result.genres;
            }
            callback();
        }

        dataInfo.getMovieList = async function (genre, append, callback) {
            if (dataInfo.movieList[genre] == undefined || append == true) {
                if (dataInfo.movieList[genre] == undefined) {
                    dataInfo.movieList[genre] = { list: [], page: 0 };
                }
                let result = await apiGet('movieList', { api_key: dataInfo.api_key, with_genres: genre, page: dataInfo.movieList[genre].page + 1 });
                if (result.results.length > 0) {
                    dataInfo.currentGenre = genre;
                    dataInfo.movieList[genre].page++;
                    dataInfo.movieList[genre].list = dataInfo.movieList[genre].list.concat(result.results);
                }
            }
            callback(genre, append);
        }

        dataInfo.getMovieDetail = async function (genre, id, callback) {
            let index = dataInfo.movieList[genre].list.findIndex(x => { return x.id == id });
            if (dataInfo.movieList[genre].list[index][detail_NC] == undefined || isEmpty(dataInfo.movieList[genre].list[index][detail_NC])) {
                dataInfo.movieList[genre].list[index][detail_NC] = await apiGet('movieDetail', { api_key: dataInfo.api_key, language: dataInfo.language }, id);
            }
            callback(genre, id);
        }

        async function apiGet(name, argument, action) {
            let result;
            spin(true);
            try {
                result = await $.ajax({
                    url: dataInfo.api_url + dataInfo.api[name] + (action == undefined ? '' : '/' + action),
                    type: 'GET',
                    data: argument,
                    contentType: "json",
                    dataType: 'json',
                });
                spin(false);
                return result;
            } catch (error) {
                spin(false);
                return {};
            };
        }
    }(window.testSixty));

// #endregion controller //

//-------------------------------------------------------------------------------------//

// #region view //

    (function (testSixty) {
        var dataInfo = testSixty.getData();
        var viewInfo = {
            moviePosition: [],
            detail: {
                title: '',
                time: '',
                country: '',
                language: '',
                image: '',
                overview: '',

                //methods
                setData: {},
            }
        };

        viewInfo.setData = function (data) {
            viewInfo.detail.title = (!isEmpty(data.title) && !isEmpty(data.release_date.substring)) ? [data.title, ' (', data.release_date.substring(0, 4), ')'].join('') : '';
            viewInfo.detail.time = !isEmpty(data.runtime) ? [Math.floor(data.runtime / 60), 'hour', data.runtime % 60, 'min'].join(' ') : '';
            viewInfo.detail.image = (!isEmpty(dataInfo.image_url) && !isEmpty(data.backdrop_path)) ? dataInfo.image_url + data.backdrop_path : '';
            viewInfo.detail.overview = !isEmpty(data.overview) ? data.overview : '';
            viewInfo.detail.language = !isEmpty(data.spoken_languages[0].english_name) ? data.spoken_languages[0].english_name : '';
            viewInfo.detail.country = !isEmpty(data.production_countries[0].iso_3166_1) ? data.production_countries[0].iso_3166_1 : '';
        }

        
        $('.title').text('FILMS');
        disableKeyForScroll();
        dataInfo.getGenreList(updateGenres);

        function updateGenres() {
            let genreList = $.map(dataInfo.genreList, function (item) { return { id: item.id, text: item.name } });
            $('#genre-bar-container').OptionBar({ id: 'genreBar', selectList: genreList, selectedItem: genreList[0] });
            $('#genreBar.option-bar li:first-child').trigger('click');
        }

        function updateMovies(genre, append) {
            let movieList = $.map(dataInfo.movieList[genre].list, function (item) { return { id: item.id, src: dataInfo.image_url + item.poster_path } });
            $('#movie-grid-container').ImageGrid({ id: 'movieGrid', selectList: movieList, append: append });
            movieFocus(genre);
        }

        function updateMovieDetail(genre, id) {
            let index = dataInfo.movieList[genre].list.findIndex(x => { return x.id == id });
            viewInfo.setData(dataInfo.movieList[genre].list[index].detail_1336);
            $('[data-model]').each(function () {
                let type = $(this).data('type');
                switch (type) {
                    case 'text':
                        $(this).text(viewInfo.detail[$(this).data('model')]);
                        break;
                    case 'src':
                        $(this).attr('src' , viewInfo.detail[$(this).data('model')]);
                        break;
                }
            });
        }

        function movieFocus(genre) {
            let movie = $('#movie-grid-container input:nth-child(' + Number(viewInfo.moviePosition[genre].y * 5 + viewInfo.moviePosition[genre].x + 1) + ')');
            $(movie).focus();
            if ($(movie).isInViewport())
                !$(movie).scrollToMiddle();
        }

        function genreFocus(genre) {
            let item;
            if (genre == undefined) {
                item = $('#genre-bar-container li.selected');
            } else {
                item = $('#genreBar').find('li[item-id=' + genre + ']');
            }
            $(item).trigger('click');
            if (!$(item).isInViewport())
                !$(item).scrollToMiddle();
        }

        function disableKeyForScroll() {
            window.addEventListener("keydown", function (e) {
                if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
                    e.preventDefault();
                }
            }, false);
        }

        $(document).on('click', '#movie-grid-container input', function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            viewInfo.moviePosition[dataInfo.currentGenre] = { x: $(this).index() % 5, y: Math.floor($(this).index() / 5) };
            movieFocus(dataInfo.currentGenre)
        });

        $(document).on('dblclick', '#genre-bar-container li', function (e) {
            let genre = parseInt(JSON.parse($('#genre-bar-container').prop('selected'))['id']);
            gotoMovie(genre);
        });

        $(document).on('dblclick', '#movie-grid-container input', function (e) {
            gotoDetail(dataInfo.currentGenre, $(this).attr('item-id'));
        });

        $(document).on('keyup', '#genre-bar-container li', function (e) {
            let code = e.keyCode || e.which;
            if (![13, 38, 39, 40].includes(code))
                return;

            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            let genre = parseInt(JSON.parse($('#genre-bar-container').prop('selected'))['id']);
            let pos = parseInt($('#genre-bar-container').prop('selectedIndex'));
            switch (code) {
                case 13: // enter
                    gotoMovie(genre);
                    return;
                case 38: // up
                    pos = (pos <= 0 ? 0 : pos - 1);
                    let nextGenre = $('#genreBar.option-bar li:nth-child(' + Number(pos + 1) + ')').attr('item-id');
                    genreFocus(nextGenre);
                    if (pos == 0)
                        $('html, body').animate({ scrollTop: 0 });
                    break;
                case 39: // right
                    if (dataInfo.currentGenre != undefined) {
                        if (dataInfo.movieList[dataInfo.currentGenre] != undefined && dataInfo.movieList[dataInfo.currentGenre].list.length > 0) {
                            genreFocus(dataInfo.currentGenre);
                            gotoMovie(dataInfo.currentGenre);
                        }
                    }
                    break;
                case 40: { // down
                    pos = (pos >= (dataInfo.genreList.length-1) ? dataInfo.genreList.length-1 : pos + 1);
                    let nextGenre = $('#genreBar.option-bar li:nth-child(' + Number(pos + 1) + ')').attr('item-id');
                    genreFocus(nextGenre);
                    break;
                }
            }
        });

        $(document).on('keyup', '#movie-grid-container input', function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            let code = e.keyCode || e.which;
            if (![13, 37, 38, 39, 40].includes(code) && $('#movie-detail-container').css('display') == 'none')
                return;
            if (![66, 98].includes(code) && $('#movie-detail-container').css('display') != 'none')
                return;

            let genre = parseInt(JSON.parse($('#genre-bar-container').prop('selected'))['id']);
            let pos = { x: 0, y: 0 };
            pos = { x: viewInfo.moviePosition[genre].x, y: viewInfo.moviePosition[genre].y };
            switch (code) {
                case 37: // left
                    pos.x--;
                    break;
                case 38: // up
                    pos.y--;
                    break;
                case 39: // right
                    pos.x++;
                    break;
                case 40: // down
                    pos.y++;
                    break;
                case 13: // enter
                    gotoDetail(genre, $(this).attr('item-id'));
                    return;
                case 66:
                case 98: // back
                    hideDetail();
                    return;
            }

            if (pos.x < 0) {
                genreFocus();
                return;
            } else if (pos.x > 4) {
                pos.x = 0;
                pos.y++;
            } else if (pos.y < 0) {
                pos.y = 0;
            }

            viewInfo.moviePosition[genre] = pos;

            if (pos.y * 5 + pos.x >= dataInfo.movieList[genre].list.length) {
                dataInfo.getMovieList(genre, true, updateMovies);
            } else {
                movieFocus(genre);
            }
        });

        $(document).on('keyup', '#movie-detail-container', function (e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();

            let code = e.keyCode || e.which;
            if (code == 66 || code == 98) {
                hideDetail();
            }
        });

        function gotoMovie(genre) {
            if (viewInfo.moviePosition[genre] == undefined) {
                viewInfo.moviePosition[genre] = { x: 0, y: 0 };
            }
            dataInfo.getMovieList(genre, false, updateMovies);
        }

        function gotoDetail(genre, id) {
            let index = dataInfo.movieList[genre].list.findIndex(x => x.id == id);
            $('#detail-title').text(dataInfo.movieList[genre].list[index].original_title);
            $('#detail-overview').text(dataInfo.movieList[genre].list[index].overview);
            dataInfo.getMovieDetail(genre, id, updateMovieDetail);
            $('#movie-detail-container').css('display', 'block');
            $('#movie-container').addClass('slide');
            $('#movie-detail-container').addClass('slide-detail');
        }

        function hideDetail() {
            $('#movie-container').removeClass('slide');
            $('#movie-detail-container').removeClass('slide-detail');
            $('#movie-detail-container').css('display', 'none');
        }

        $(window).scroll(function () { fetchMovies(); });
        $(window).resize(function () { fetchMovies(); });

        function fetchMovies() {
            if ($(window).scrollTop() == $(document).height() - $(window).height()) {
                if (dataInfo.currentGenre != undefined) {
                    if (dataInfo.movieList[dataInfo.currentGenre] != undefined) {
                        dataInfo.getMovieList(dataInfo.currentGenre, true, updateMovies);
                    }
                }
            }
        }

    }(window.testSixty));

// #endregion view //

});