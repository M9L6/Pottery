pc.script.createLoadingScreen(function (app) {


    var hideSplash = function () {
        $('.loadingpage').hide();
    };

    var setProgress = function (value) {
        value = Math.min(1,Math.max(value,0));
        $('.loadingbar').width(value*100+"%");
    };



    app.on('preload:end', function () {
        app.off('preload:progress');
    });
    app.on('preload:progress', setProgress);
    app.on('start', hideSplash);
});