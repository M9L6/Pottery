var TakeScreenShot = pc.createScript('TakeScreenShot');

TakeScreenShot.prototype.initialize = function() {
    var app = this.app;
    var infoobj = app.root.findByName('info');
    infoobj.enabled = false;
    console.log(('aaa'));
    $('.takeshootbtn').click(function(){
                $('.takephotosound')[0].play();
                infoobj.enabled = true;
                app.once('frameend', function() {
                    var image = app.graphicsDevice.canvas.toDataURL('image/png');
                    $('.takeshootshow').attr('src',image);
                    //window.location.href = image.replace('image/png', 'image/octet-stream');
                    infoobj.enabled = false;
                    $('.takeshootpage').show();
                });
            });

};
