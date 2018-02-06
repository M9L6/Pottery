var PlayerControl = pc.createScript('PlayerControl');
PlayerControl.attributes.add('AddTexs',{type:'asset',array:true});
PlayerControl.attributes.add('bottomtex',{type:'asset'});
var AppState = {
    curstate:0,
    states:{
        ChangeSize:0,
        ToTexColorState:1,
        ChangeTex:2,
        ChangeColor:3,
        ToLookState:4,
        CameraConrol:5
    }
};

function SaveJSONData(filename,storageObj){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storageObj));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href",dataStr);
    dlAnchorElem.setAttribute("download", filename+".json");
    dlAnchorElem.click();
    
}

// initialize code called once per entity
PlayerControl.prototype.initialize = function() {
    var app = this.app;
    this.SetResolution(app);
    this.GetControlObj(app);
    this.SetBaseParam();
    this.AddControl(app);
    this.AddUIListener();
    
};

// update code called every frame
PlayerControl.prototype.update = function(dt) {
    if(this.app.keyboard.wasPressed(pc.KEY_S)){
        this.SaveModelData();
    }
    
    this.UpdateSurfaceColor(dt);
    
};

function ParseFloatArray(array)
{
    var count = 8;
    for(var i =0;i<array.length;i++){
        array[i] = Math.floor(array[i]*Math.pow(10,count))/Math.pow(10,count);
    }
    return array;
}

PlayerControl.prototype.SaveModelData = function(){
    var model = {m:[]};
    var allmeshes = this.PotteryModel.allmeshes,
        matsdata = this.PotteryModel.matsdata;
    model.i = allmeshes[0].indices;
    for(var i=0;i<allmeshes.length;i++)
    {   
        var mesh = {};
        var m = allmeshes[i],
            md = matsdata[i];
        mesh.dtex = md.dtex === ''?'diffuse.jpg':md.dtex;
        mesh.ntex = md.ntex === ''?'normal.jpg':md.ntex;
        mesh.c =  md.c === ''?'#ffffff':md.c;
        mesh.tex1 = md.tex1 === ''?'white.jpg':md.tex1;
        mesh.p = ParseFloatArray(m.positions);
        mesh.uv0 = ParseFloatArray(m.uvs);
        mesh.uv1 = ParseFloatArray(m.uvs1);
        mesh.n = ParseFloatArray(m.normals);
        mesh.t = ParseFloatArray(m.tangents);
        model.m.push(mesh);       
    }
    //console.log(JSON.stringify(model));
    SaveJSONData('model'+Date.now(),model);
};


PlayerControl.prototype.PrintMeshesJson = function(){
 
        var meshes = [];
        for(var i = 0;i<this.PotteryModel.allmeshes.length;i++){
            var mesh = {};
            mesh.positions = this.PotteryModel.allmeshes[i].positions;
            mesh.indices = this.PotteryModel.allmeshes[i].indices;
            mesh.normals = this.PotteryModel.allmeshes[i].normals;
            mesh.tangents = this.PotteryModel.allmeshes[i].tangents;
            mesh.uvs = this.PotteryModel.allmeshes[i].uvs;
            mesh.uvs1 = this.PotteryModel.allmeshes[i].uvs1;
            meshes.push(mesh);
        }
};


PlayerControl.prototype.ControlPottery = function(dx,dy){
    var scalex = Math.abs(dx) > Math.abs(dy);
    dx /= this.maxwidth;
    dy /= this.maxheight;
    switch(this.ClickPointState)
    {
        case PotteryModel.ClickPoint.TopOut:
            break;
        case PotteryModel.ClickPoint.LeftOut:
            this.PotteryModel.RadiusUpdatePoints(this.clickheight,dx);
            break;
        case PotteryModel.ClickPoint.RightOut:
            this.PotteryModel.RadiusUpdatePoints(this.clickheight,dx);
            break;
        case PotteryModel.ClickPoint.Inner:
            if(scalex){
                this.PotteryModel.RadiusUpdatePoints(this.clickheight,dx);
            }
            else
            {
                 this.PotteryModel.HeightUpdatePoints(dy);
            }
            break;
        default:
            break;
    }
    
};

PlayerControl.prototype.RayCast = function(x,y){
    if(AppState.curstate > AppState.states.ChangeColor){
        return;
    }
    var depth = 12;
    var worldpos = this.camera.screenToWorld(x,y,depth);
    var orion = this.camera.entity.getPosition().clone();
    var dir = new pc.Vec3(worldpos.x-orion.x,worldpos.y-orion.y,worldpos.z-orion.z);
    var ray = new pc.Ray(orion,dir);
    
    var clickpoint = new pc.Vec3();
    this.PotteryCheckPlane.intersectsRay(ray,clickpoint); 

    
    switch(AppState.curstate){
        case AppState.states.ChangeSize:
            if(this.clickheight < 100 && this.clickwidth < 100)
            {
                var dx = clickpoint.x < 0 ? this.clickwidth-clickpoint.x:clickpoint.x - this.clickwidth;
                var dy = clickpoint.y - this.clickheight;
                this.ControlPottery(dx,dy);
            }
            this.clickheight = clickpoint.y;
            this.clickwidth = clickpoint.x;
            this.ClickPointState =  this.PotteryModel.CheckOutOrInner(clickpoint.x,clickpoint.y);
            break;
        case AppState.states.ChangeTex:
            //check heightsegment
            var index = this.PotteryModel.CheckHeightPos(clickpoint.x,clickpoint.y);
            var mat = null;
            for(var i =0;i<this.curaddtexlength;i++){
                if(this.lastindex !== -1 && this.lastindex !== index)
                {
                    if(this.lastindex +i < this.PotteryModel.HeightSegments-1){
                        mat = this.PotteryModel.mats[this.lastindex+i];
                        mat.setParameter('changecolor',new pc.Color(0,0,0).data);
                    }   
                }
            }
            for(var i =0;i<this.curaddtexlength;i++){
                if(index !== -1 && index !== this.lastindex)
                {
                    if(index +i < this.PotteryModel.HeightSegments-1){
                        mat = this.PotteryModel.mats[index+i];
                        mat.setParameter('changecolor',new pc.Color(1,1,1).data);
                    }
                }
            }
            
            this.lastindex = index;
            break;
        case AppState.states.ChangeColor:
            var index = this.PotteryModel.CheckHeightPos(clickpoint.x,clickpoint.y);
            /*var mat = null;
            if(index !== -1)
            {
                mat = this.PotteryModel.mats[index];
                var curcolor = mat.surfacecolor;
                var t = 0.1,
                    r = this.curcolor.r*t + curcolor.r*(1-t),
                    g = this.curcolor.g*t+curcolor.g*(1-t),
                    b = this.curcolor.b*t+curcolor.b*(1-t);
                console.log(r+' '+g+' '+b+'    surfacecolor:'+this.curcolor.r+' '+this.curcolor.g+' '+this.curcolor.b);
                
                mat.surfacecolor.set(r,g,b);
                mat.setParameter('surfacecolor',mat.surfacecolor.data);
                var matsdata =  this.PotteryModel.matsdata[index];
                matsdata.c = mat.surfacecolor.toString();
            }*/
            this.lastindex = index;
            break;
        default:
            break;
    }

};

PlayerControl.prototype.UpdateSurfaceColor = function(dt){
    if(AppState.curstate ===  AppState.states.ChangeColor){
        if(this.lastindex !== -1)
        {
            var mat = this.PotteryModel.mats[this.lastindex];
            var curcolor = mat.surfacecolor;
            var t = dt/0.5,
                r = this.curcolor.r*t + curcolor.r*(1-t),
                g = this.curcolor.g*t+curcolor.g*(1-t),
                b = this.curcolor.b*t+curcolor.b*(1-t);
            //console.log(r+' '+g+' '+b+'    surfacecolor:'+this.curcolor.r+' '+this.curcolor.g+' '+this.curcolor.b);   
            mat.surfacecolor.set(r,g,b);
            mat.setParameter('surfacecolor',mat.surfacecolor.data);
            var matsdata =  this.PotteryModel.matsdata[this.lastindex];
            matsdata.c = mat.surfacecolor.toString();
        }
    }
};


PlayerControl.prototype.Reset = function(){
            
    switch(AppState.curstate){
        case AppState.states.ChangeSize:
            this.clickwidth = 1000;
            this.clickheight = 1000;
            this.ClickPointState = -1;
            break;
        case AppState.states.ChangeTex:    
            if(this.lastindex !== -1){
                this.PotteryModel.UploadUV1ToMesh(this.lastindex,this.curaddtexlength);
                for(var i =0;i<this.curaddtexlength;i++){
                    if(this.lastindex+i >= this.PotteryModel.HeightSegments-1){
                        break;
                    }
                    var mat = this.PotteryModel.mats[this.lastindex+i];
                    mat.setParameter('AddTex',this.AddTexs[this.curaddtexindex].resource);
                    mat.setParameter('changecolor',new pc.Color(0,0,0).data);
                    var matsdata =  this.PotteryModel.matsdata[this.lastindex+i];
                    matsdata.tex1 = this.AddTexs[this.curaddtexindex].name;
                }
                this.lastindex = -1;
            }
            break;
        case AppState.states.ChangeColor:
            this.lastindex = -1;
            
            break;
        default:
            break;
    }
    
};

PlayerControl.prototype.SetResolution = function(app){
    app.graphicsDevice.maxPixelRatio = window.devicePixelRatio === 1 ? 1:2;
    var canvas = app.graphicsDevice.canvas;
    app.resizeCanvas(canvas.width, canvas.height);
    canvas.style.width = '';
    canvas.style.height = '';
}; 

PlayerControl.prototype.GetControlObj = function(app){
    this.potteryall = app.root.findByName('potteryall');
    this.potteryrotatecontrol = this.potteryall.script.rotate;
    this.potterybottommat = this.potteryall.findByName('bottom').model.model.meshInstances[0].material;
    this.potterybottommat.diffuseMap = null;
    this.potterybottommat.update();
    var pottery = this.potteryall.findByName('pottery');
    this.PotteryModel = pottery.script.PotteryModel;
    this.cameraobj = app.root.findByName('Camera');
    this.bg = this.cameraobj.findByName('bg');
    this.camera = this.cameraobj.camera;  
};

PlayerControl.prototype.SetBaseParam = function(){
    this.lastindex = -1;
    this.viewwidth = window.innerWidth;
    this.viewheight = window.innerHeight;
    this.ClickPointState = -1;
    this.clickheight = 1000;
    this.clickwidth = 1000;
    this.PotteryCheckPlane = new pc.Plane(new pc.Vec3(0,0,0),new pc.Vec3(0,0,1));
    this.maxwidth = 16;
    this.maxheight = 10;
    
    this.curaddtexlength = 1;
    this.curaddtexindex = 6;
    this.lastaddtexindex = 6;
    
    this.colors = ['#ffffff','#fc1b32','#fc9125','#20aefc','#fd21cf','#fffd37','#6f22fb','#29fd77' ,'#020664','#7d1208'];
    this.curcolorindex = 0;
    this.lastcolorindex = 0;
    this.curcolor = new pc.Color().fromString(this.colors[this.curcolorindex]);
}; 

PlayerControl.prototype.AddControl = function(app){
    var startx = 0,starty = 0,self = this;
    if(app.touch){
        window.addEventListener('touchstart',function(e){
            //e.preventDefault();

            var touch0 = e.touches[0];
            startx = touch0.clientX;
            starty = touch0.clientY;
            self.RayCast(startx,starty);
        });
        window.addEventListener('touchmove',function(e){
            var touch0 = e.touches[0];
            startx = touch0.clientX;
            starty = touch0.clientY;
            self.RayCast(startx,starty);
        });
        window.addEventListener('touchend',function(e){
            if(e.touches.length === 0)
            {
                self.Reset();
            }
        });
    }
    else
    {
        window.addEventListener('mousedown',function(e){
            startx = e.x;
            starty = e.y;
            self.RayCast(startx,starty);
        });
        window.addEventListener('mousemove',function(e){
            if(!e.buttons[pc.MOUSEBUTTON_LEFT]){
                return;
            }
            startx = e.x;
            starty = e.y;
            self.RayCast(startx,starty);
        });
        window.addEventListener('mouseup',function(e){
            self.Reset();
        });
        
    }  
};
PlayerControl.prototype.AddUIListener = function(){

    $('.changesizepage').show();
    setTimeout(function(){$('.tipspage').fadeOut(1000)},2000);
    $('.bakebtn').click(function(){
        var self = this;
        var tonextsceneeffect = this.cameraobj.script.ToNextSceneEffect;
        tonextsceneeffect.enabled = true;
        var showtween = new TWEEN.Tween({timer:1})
            .to({timer:0},1500)
            .onStart(function(){

                self.potteryrotatecontrol.rotatespeed = -20;
                self.potterybottommat.diffuseMap = self.bottomtex.resource;
                self.potterybottommat.update();
                $('.texcolorpage').fadeIn(1500);
            })
            .onUpdate(function(){
                tonextsceneeffect.timer = this.timer;
            })
            .onComplete(function(){
                AppState.curstate = AppState.states.ChangeTex;
                tonextsceneeffect.enabled = false;
            }),
            hidetween = new TWEEN.Tween({timer:0})
                .to({timer:1},1500)
                .onUpdate(function(){
                    tonextsceneeffect.timer = this.timer;
                })
                .onComplete(function(){
                    showtween.start();
                }).start();
        $('.changesizepage').fadeOut();
        AppState.curstate = AppState.states.ToTexColorState;
    }.bind(this));

    var TexColorState = {
        curstate:0,
        states:{
            Tex:0,
            Line:1,
            Color:2
        }
    };
    var lasttopchoosebtn = $('.texbtn');


    var texbtns = [],colorbtns = [];
    texbtns.push($('.texbtn1'));
    texbtns.push($('.texbtn2'));
    texbtns.push($('.texbtn3'));
    texbtns.push($('.linebtn1'));
    texbtns.push($('.linebtn2'));
    texbtns.push($('.linebtn3'));
    texbtns.push($('.texeasebtn'));
    texbtns.push($('.lineeasebtn'));

    colorbtns.push($('.coloreasebtn'));
    colorbtns.push($('.colorbtn1'));
    colorbtns.push($('.colorbtn2'));
    colorbtns.push($('.colorbtn3'));
    colorbtns.push($('.colorbtn4'));
    colorbtns.push($('.colorbtn5'));
    colorbtns.push($('.colorbtn6'));
    colorbtns.push($('.colorbtn7'));
    colorbtns.push($('.colorbtn8'));
    colorbtns.push($('.colorbtn9'));

    var self = this;
    function ChangeTexColorState(){
        switch (TexColorState.curstate){
            case TexColorState.states.Tex:
                $('.choosetex').hide();
                $('.texbtn').removeClass('bottomline');
                texbtns[self.curaddtexindex].removeClass('bigscale');
                break;
            case TexColorState.states.Color:
                $('.choosecolor').hide();
                $('.colorbtn').removeClass('bottomline');
                colorbtns[self.curcolorindex].removeClass('bigscale');
                break;
            case TexColorState.states.Line:
                $('.chooseline').hide();
                $('.linebtn').removeClass('bottomline');
                if(self.curaddtexindex === 6){
                    texbtns[7].removeClass('bigscale');
                }else{
                    texbtns[self.curaddtexindex].removeClass('bigscale');
                }
                break;
        }
    };

    $('.colorbtn').click(function(){
        if(TexColorState.curstate === TexColorState.states.Color){
            return;
        }
        ChangeTexColorState();
        this.curcolorindex = 0;
        this.lastcolorindex = 0;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        colorbtns[this.curcolorindex].addClass('bigscale');
        $('.colorbtn').addClass('bottomline');
        $('.choosecolor').show();
        TexColorState.curstate = TexColorState.states.Color;
        AppState.curstate = AppState.states.ChangeColor;

    }.bind(this));

    $('.linebtn').click(function(){
        if(TexColorState.curstate === TexColorState.states.Line){
            return;
        }
        ChangeTexColorState();
        this.curaddtexindex = 6;
        this.curaddtexlength = 1;
        this.lastaddtexindex = 7;
        texbtns[7].addClass('bigscale');
        $('.linebtn').addClass('bottomline');
        $('.chooseline').show();
        TexColorState.curstate = TexColorState.states.Line;
        AppState.curstate = AppState.states.ChangeTex;

    }.bind(this));

    $('.texbtn').click(function(){
        if(TexColorState.curstate === TexColorState.states.Tex){
            return;
        }
        ChangeTexColorState();
        this.curaddtexindex = 6;
        this.curaddtexlength = 1;
        this.lastaddtexindex = 6;
        texbtns[6].addClass('bigscale');
        $('.texbtn').addClass('bottomline');
        $('.choosetex').show();
        TexColorState.curstate = TexColorState.states.Tex;
        AppState.curstate = AppState.states.ChangeTex;

    }.bind(this));



    texbtns[0].click(function(){
        this.curaddtexindex = 0;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 0;
        this.curaddtexlength = 4;
    }.bind(this));
    texbtns[1].click(function(){
        this.curaddtexindex = 1;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 1;
        this.curaddtexlength = 4;
    }.bind(this));
    texbtns[2].click(function(){
        this.curaddtexindex = 2;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 2;
        this.curaddtexlength = 4;
    }.bind(this));
    texbtns[3].click(function(){
        this.curaddtexindex = 3;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 3;
        this.curaddtexlength = 2;
    }.bind(this));
    texbtns[4].click(function(){
        this.curaddtexindex = 4;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 4;
        this.curaddtexlength = 2;
    }.bind(this));
    texbtns[5].click(function(){
        this.curaddtexindex = 5;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 5;
        this.curaddtexlength = 2;
    }.bind(this));
    texbtns[6].click(function(){
        this.curaddtexindex = 6;
        if(this.lastaddtexindex !== this.curaddtexindex){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[this.curaddtexindex].addClass('bigscale');
        }
        this.lastaddtexindex = 6;
        this.curaddtexlength = 1;
    }.bind(this));
    texbtns[7].click(function(){
        this.curaddtexindex = 6;
        if(this.lastaddtexindex !==7 && this.lastaddtexindex !== this.curaddtexindex ){
            texbtns[this.lastaddtexindex].removeClass('bigscale');
            texbtns[7].addClass('bigscale');
        }
        this.lastaddtexindex = 7;
        this.curaddtexlength = 1;
    }.bind(this));

    colorbtns[0].click(function(){
        this.curcolorindex = 0;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 0;
    }.bind(this));

    colorbtns[1].click(function(){
        this.curcolorindex = 1;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 1;
    }.bind(this));
    colorbtns[2].click(function(){
        this.curcolorindex = 2;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 2;
    }.bind(this));
    colorbtns[3].click(function(){
        this.curcolorindex = 3;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 3;
    }.bind(this));
    colorbtns[4].click(function(){
        this.curcolorindex = 4;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 4;
    }.bind(this));
    colorbtns[5].click(function(){
        this.curcolorindex = 5;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 5;
    }.bind(this));
    colorbtns[6].click(function(){
        this.curcolorindex = 6;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 6;
    }.bind(this));
    colorbtns[7].click(function(){
        this.curcolorindex = 7;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 7;
    }.bind(this));
    colorbtns[8].click(function(){
        this.curcolorindex = 8;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 8;
    }.bind(this));
    colorbtns[9].click(function(){
        this.curcolorindex = 9;
        this.curcolor.fromString(this.colors[this.curcolorindex]);
        if(this.lastcolorindex !== this.curcolorindex ){
            colorbtns[this.lastcolorindex].removeClass('bigscale');
            colorbtns[this.curcolorindex].addClass('bigscale');
        }
        this.lastcolorindex = 9;
    }.bind(this));

    var movelr = false,ismoving = false,animtime = 500;
    $('.surebtn').click(function(){
        if(ismoving){
            return;
        }
        ismoving = true;
        movelr = !movelr;
        $('.surebtn').animate({right:movelr?"120px":'10px',opacity:movelr?0.5:1.0},animtime,function(){
           ismoving = false;
        });
        movelr && ($('.completebtn').show(),$('.cancelbtn').show());
        $('.completebtn').animate({opacity:movelr?1.0:0.0},animtime,function(){
            !movelr && ($('.completebtn').hide(),$('.cancelbtn').hide());
        });
        $('.cancelbtn').animate({right: movelr?"65px":"10px",opacity:movelr?1.0:0.0},animtime,function(){
        });

    });
    $('.completebtn').click(function(){
        if(ismoving){
            return;
        }
        ismoving = true;
        movelr = !movelr;
        $('.surebtn').animate({right:"10px",opacity:1.0},animtime,function(){
            ismoving = false;
        });

        $('.completebtn').animate({opacity:0.0},animtime,function(){
            $('.completebtn').hide();
        });
        $('.cancelbtn').animate({right:"10px",opacity:0.0},animtime,function(){
            $('.cancelbtn').hide();
        });
        var self = this;
        var tonextsceneeffect = this.cameraobj.script.ToNextSceneEffect;
        tonextsceneeffect.enabled = true;
        var showtween = new TWEEN.Tween({timer:1})
            .to({timer:0},1500)
            .onStart(function(){
                $('.showpage').fadeIn(1500);
                self.bg.enabled = false;
                self.potteryall.setPosition(0,1.2,0);
            })
            .onUpdate(function(){
                tonextsceneeffect.timer = this.timer;
            })
            .onComplete(function(){
                AppState.curstate = AppState.states.CameraConrol;
                tonextsceneeffect.enabled = false;

                setTimeout(function(){
                    $('.tips360').fadeOut();
                },2000);
            }),
            hidetween = new TWEEN.Tween({timer:0})
                .to({timer:1},1500)
                .onUpdate(function(){
                    tonextsceneeffect.timer = this.timer;
                })
                .onComplete(function(){
                    showtween.start();
                }).start();
        $('.texcolorpage').fadeOut();
        AppState.curstate = AppState.states.ToLookState;

    }.bind(this));
    $('.cancelbtn').click(function(){
        if(ismoving){
            return;
        }
        movelr = !movelr;
        ismoving = true;
        $('.surebtn').animate({right:"10px",opacity:1.0},animtime,function(){
            ismoving = false;
        });

        $('.completebtn').animate({opacity:0.0},animtime,function(){
            $('.completebtn').hide();
        });
        $('.cancelbtn').animate({right:"10px",opacity:0.0},animtime,function(){
            $('.cancelbtn').hide();
        });
    });
    $('.closetakeshoot').click(function(){
        $('.takeshootpage').hide();
    });

    $('.aboutusbtn').click(function(){
       $('.aboutpage').show();
    });
    $('.closeaboutbtn').click(function(){
        $('.aboutpage').hide();
    })

    $('.refreshbtn').click(function(){
        window.location.href = window.location.href;
    });
    /*if(!pc.platform.ios){
         $('.changesizepage').on('touchmove',function(e){
         e.preventDefault();
         });
         $('.texcolorpage').on('touchmove',function(e){
         e.preventDefault();
         });
         $('.showpage').on('touchmove',function(e){
         e.preventDefault();
         });
         $('.aboutpage').on('touchmove',function(e){
         e.preventDefault();
         });
         $('.takeshootpage').on('touchmove',function(e){
         e.preventDefault();
         });
    }*/
};