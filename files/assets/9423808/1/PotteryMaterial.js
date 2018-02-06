var PotteryMaterial = pc.createScript('PotteryMaterial');
PotteryMaterial.attributes.add('whitetex',{type:'asset'});
PotteryMaterial.attributes.add('diffuseMap',{type:'asset'});
PotteryMaterial.attributes.add('normalMap',{type:'asset'});
PotteryMaterial.attributes.add('bumpiness',{type:'number',default:0.25});
// initialize code called once per entity
PotteryMaterial.prototype.initialize = function() {
    var app = this.app;
    this.materials = [];
    
    this.on('attr:diffuseMap',function(){
        for(var i= 0;i<this.materials.length;i++){
            var mat = this.materials[i];
            mat.diffuseMap = this.diffuseMap === null ? null:this.diffuseMap.resource;
            mat.update();
        }
    });
    
    this.on('attr:normalMap',function(){
        for(var i= 0;i<this.materials.length;i++){
            var mat = this.materials[i];
            mat.normalMap = this.normalMap === null ? null:this.normalMap.resource;
            mat.update();
        }
    });
    this.on('attr:bumpiness',function(){
        for(var i= 0;i<this.materials.length;i++){
            var mat = this.materials[i];
            mat.bumpiness = this.bumpiness;
            mat.update();
        }
    });
    
};

// update code called every frame
PotteryMaterial.prototype.update = function(dt) {
    
};

PotteryMaterial.prototype.CreateMaterial = function(){
    
    var app = this.app;
    var mat = new pc.StandardMaterial();
    mat.shadingModel = pc.SPECULAR_BLINN;
    mat.chunks.startVS = [
        'void main(void) {',
        '  vUv1 = getUv1();',
        '  gl_Position = getPosition();'
    ].join('\n');
    
    mat.chunks.startPS = [
        'uniform sampler2D AddTex;',
        'uniform vec4 changecolor;',
        'uniform vec4 surfacecolor;',
        'void main(void) {',
        '    dDiffuseLight = vec3(0);',
        '    dSpecularLight = vec3(0);',
        '    dReflection = vec4(0);',
        '    dSpecularity = vec3(0);  \n'
    ].join('\n');
    mat.chunks.endPS = [
        '    vec3 addcolor = texture2DSRGB(AddTex,vUv1).rgb;',
        '    gl_FragColor.rgb = vec3(changecolor.rgb) + combineColor()*addcolor*surfacecolor.rgb;',
        '    gl_FragColor.rgb += getEmission();',
        '    gl_FragColor.rgb = addFog(gl_FragColor.rgb);',
        '    #ifndef HDR',
        '       gl_FragColor.rgb = toneMap(gl_FragColor.rgb);',
        '       gl_FragColor.rgb = gammaCorrectOutput(gl_FragColor.rgb);',
        '    #endif \n'
    ].join('\n');
    mat.forceUv1 = true;
    mat.setParameter('changecolor',new pc.Color(0,0,0).data);
    mat.setParameter('surfacecolor',new pc.Color(1,1,1).data);
    mat.surfacecolor = new pc.Color(1,1,1);
    mat.setParameter('AddTex',this.whitetex.resource);
    mat.diffuseMap = this.diffuseMap === null ? null:this.diffuseMap.resource;
    mat.normalMap = this.normalMap === null ? null:this.normalMap.resource;
    mat.bumpiness = this.bumpiness;
    mat.update();
    
    this.materials.push(mat);
    return mat;
};


