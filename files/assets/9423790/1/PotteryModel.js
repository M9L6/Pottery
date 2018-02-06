var PotteryModel = pc.createScript('PotteryModel');
PotteryModel.attributes.add('maxHeight',{type:'number',default:1});
PotteryModel.attributes.add('minHeight',{type:'number',default:0.5});
PotteryModel.attributes.add('maxRadius',{type:'number',default:1});
PotteryModel.attributes.add('minRadius',{type:'number',default:0.5});
PotteryModel.attributes.add('HeightSegments',{type:'number',default:21});
PotteryModel.attributes.add('WidthSegments',{type:'number',default:100});
PotteryModel.attributes.add('Thickness',{type:'number',default:0.1});
PotteryModel.ClickPoint = {
    TopOut:0,
    LeftOut:1,
    RightOut:2,
    Inner:3
};
// initialize code called once per entity
PotteryModel.prototype.initialize = function() {
    this.PotteryMaterial = this.entity.script.PotteryMaterial;
    this.InitPointParam();
    this.CreateInnerPoints();
    this.CreateOutPoints();
    this.CreateIndices();
    this.normals = pc.calculateNormals(this.positions,this.indices);
    this.tangents = pc.calculateTangents(this.positions,this.normals,this.uvs,this.indices);
    this.CreateMeshInstances();

};

// update code called every frame
PotteryModel.prototype.update = function(dt) {
    
};

PotteryModel.prototype.createMesh = function(device, positions, opts) {
  var normals = opts && opts.normals !== undefined ? opts.normals : null;
  var tangents = opts && opts.tangents !== undefined ? opts.tangents : null;
  var colors = opts && opts.colors !== undefined ? opts.colors : null;
  var uvs = opts && opts.uvs !== undefined ? opts.uvs : null;
  var uvs1 = opts && opts.uvs1 !== undefined ? opts.uvs1 : null;
  var indices = opts && opts.indices !== undefined ? opts.indices : null;
  var vertexDesc = [{semantic:pc.SEMANTIC_POSITION, components:3, type:pc.ELEMENTTYPE_FLOAT32}];
  if (normals !== null) {
    vertexDesc.push({semantic:pc.SEMANTIC_NORMAL, components:3, type:pc.ELEMENTTYPE_FLOAT32});
  }
  if (tangents !== null) {
    vertexDesc.push({semantic:pc.SEMANTIC_TANGENT, components:4, type:pc.ELEMENTTYPE_FLOAT32});
  }
  if (colors !== null) {
    vertexDesc.push({semantic:pc.SEMANTIC_COLOR, components:4, type:pc.ELEMENTTYPE_UINT8, normalize:true});
  }
  if (uvs !== null) {
    vertexDesc.push({semantic:pc.SEMANTIC_TEXCOORD0, components:2, type:pc.ELEMENTTYPE_FLOAT32});
  }
  if (uvs1 !== null) {
    vertexDesc.push({semantic:pc.SEMANTIC_TEXCOORD1, components:2, type:pc.ELEMENTTYPE_FLOAT32});
  }
  var vertexFormat = new pc.VertexFormat(device, vertexDesc);
  var numVertices = positions.length / 3;
  var vertexBuffer = new pc.VertexBuffer(device, vertexFormat, numVertices,pc.BUFFER_DYNAMIC);
  var iterator = new pc.VertexIterator(vertexBuffer);
  for (var i = 0;i < numVertices;i++) {
    iterator.element[pc.SEMANTIC_POSITION].set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    if (normals !== null) {
      iterator.element[pc.SEMANTIC_NORMAL].set(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]);
    }
    if (tangents !== null) {
      iterator.element[pc.SEMANTIC_TANGENT].set(tangents[i * 4], tangents[i * 4 + 1], tangents[i * 4 + 2], tangents[i * 4 + 3]);
    }
    if (colors !== null) {
      iterator.element[pc.SEMANTIC_COLOR].set(colors[i * 4], colors[i * 4 + 1], colors[i * 4 + 2], colors[i * 4 + 3]);
    }
    if (uvs !== null) {
      iterator.element[pc.SEMANTIC_TEXCOORD0].set(uvs[i * 2], uvs[i * 2 + 1]);
    }
    if (uvs1 !== null) {
      iterator.element[pc.SEMANTIC_TEXCOORD1].set(uvs1[i * 2], uvs1[i * 2 + 1]);
    }
    iterator.next();
  }
  iterator.end();
  var indexBuffer = null;
  var indexed = indices !== null;
  if (indexed) {
    indexBuffer = new pc.IndexBuffer(device, pc.INDEXFORMAT_UINT16, indices.length);
    var dst = new Uint16Array(indexBuffer.lock());
    dst.set(indices);
    indexBuffer.unlock();
  }
  var aabb = new pc.BoundingBox();
  var mesh = new pc.Mesh();
  mesh.vertexBuffer = vertexBuffer;
  mesh.indexBuffer[0] = indexBuffer;
  mesh.primitive[0].type = pc.PRIMITIVE_TRIANGLES;
  mesh.primitive[0].base = 0;
  mesh.primitive[0].count = indexed ? indices.length : numVertices;
  mesh.primitive[0].indexed = indexed;
  mesh.aabb = aabb;
  return mesh;
};

PotteryModel.prototype.CreateMaterial = function(){
    var mat = this.PotteryMaterial.CreateMaterial();
    return mat;
};

PotteryModel.prototype.InitPointParam = function(){
    this.uvs = [];
    this.positions = [];
    this.indices = [];
    
    this.height = 3;
    this.radius = 1;
    this.SegmentParam = [];
    var radius = this.radius;
    for(var i =0;i<this.HeightSegments;i++){
        //radius = i % 5 === 0?pc.math.random(0.5,1)*this.radius:radius;
        this.SegmentParam.push({
            outR:radius,
            innerR:radius-this.Thickness,
            innerH:this.Thickness +(this.height-this.Thickness)*i /(this.HeightSegments-1),
            outH:this.height*i/(this.HeightSegments-1)
        });
        if(i === this.HeightSegments-1){
            this.SegmentParam[i].innerR = this.SegmentParam[i].outR;
        }
    }
};


PotteryModel.prototype.CreateInnerPoints = function(){
    //push centerpoint
    this.positions.push(0,this.Thickness,0);
    this.uvs.push(0,0);
    for(var i =0;i<this.HeightSegments;i++)
    {
        var h = this.SegmentParam[i].innerH,
            r = this.SegmentParam[i].innerR;
        for(var j = 0;j<this.WidthSegments;j++)
        {
            
            var thi = j/this.WidthSegments*Math.PI*2,
                x = r*Math.cos(thi),
                y = h,
                z = r*Math.sin(thi);
            this.positions.push(x,y,z);
            this.uvs.push(j/this.WidthSegments,i/(this.HeightSegments-1));
        }
    }
    
    
};

PotteryModel.prototype.CreateOutPoints = function(){
    //push centerpoint
    for(var i = this.HeightSegments-1;i >= 0;i--)
    {
        var h = this.SegmentParam[i].outH,
            r = this.SegmentParam[i].outR;
        for(var j = 0;j<this.WidthSegments;j++)
        {
            
            var thi = j/this.WidthSegments*Math.PI*2,
                x = r*Math.cos(thi),
                y = h,
                z = r*Math.sin(thi);
            this.positions.push(x,y,z);
            this.uvs.push(j/this.WidthSegments,i/(this.HeightSegments-1));
        }
    }
    this.positions.push(0,0,0);
    this.uvs.push(0,0);
};

PotteryModel.prototype.CreateIndices = function(){
    
    var i = 0,j=0,index1 = 0,index2=0,index3=0,startindex = 0;
    //CreateInnerBottomCircle
    for(i = 0;i<this.WidthSegments;i++)
    {
        index1 =  i+1; 
        index2 = 0;
        index3 = i +2;
        if(i === this.WidthSegments-1)
        {
            index3 = 1;
        }
        this.indices.push(index1,index2,index3);
    }
    //CreateInnerCylinder
    for(i = 0;i<this.HeightSegments-1;i++)
    {
        for(j = 0;j<this.WidthSegments;j++)
        {
            index1 = i*this.WidthSegments+j+1;
            index2 = (i+1)*this.WidthSegments+j+1;
            index3 = i*this.WidthSegments+j+2;
            if(j === this.WidthSegments-1)
            {
                index3 = i*this.WidthSegments+1;
            }
            this.indices.push(index3,index2,index1);
            index1 = (i+1)*this.WidthSegments+j+1;
            index2 = (i+1)*this.WidthSegments+j+2;
            index3 = i*this.WidthSegments+j+2;
            if(j === this.WidthSegments-1)
            {
                index3 = i*this.WidthSegments+1;
                index2 = (i+1)*this.WidthSegments+1;
            }
            this.indices.push(index3,index2,index1);
        }
        
    }
    
    //CreateOutCylinder
    for(i = 0;i<this.HeightSegments-1;i++)
    {
        for(j = 0;j<this.WidthSegments;j++)
        {
            
            index1 =  (this.HeightSegments+i)*this.WidthSegments+j+1;
            index2 = (this.HeightSegments+i+1)*this.WidthSegments+j+1;
            index3 = (this.HeightSegments+i+1)*this.WidthSegments+j+2;
            if(j === this.WidthSegments-1)
            {
                index3 = (this.HeightSegments+i+1)*this.WidthSegments+1;
            }
            this.indices.push(index3,index2,index1);
            index1 = (this.HeightSegments+i)*this.WidthSegments+j+1;
            index2 = (this.HeightSegments+i+1)*this.WidthSegments+j+2;
            index3 = (this.HeightSegments+i)*this.WidthSegments+j+2;
            if(j === this.WidthSegments-1)
            {
                index3 = (this.HeightSegments+i)*this.WidthSegments+1;
                index2 = (this.HeightSegments+i+1)*this.WidthSegments+1;
            }
            this.indices.push(index3,index2,index1);
        }
        
    }
    
    //CreateOutBottomCircle
    var centerindex = this.HeightSegments*this.WidthSegments*2+1;
    
    for(i = 0;i<this.WidthSegments;i++)
    {
        index1 = centerindex-this.WidthSegments+i; 
        index2 = centerindex;
        index3 = centerindex-this.WidthSegments+i +1;
        if(i === this.WidthSegments-1)
        {
            index3 = centerindex-this.WidthSegments;
        }
        this.indices.push(index3,index2,index1);
    }

    
};

PotteryModel.prototype.CreateUvs = function(){
    
};

PotteryModel.prototype.CreatePointColors = function(){
    
};


PotteryModel.prototype.RadiusUpdatePoints = function(height,addradius){
    
    var lerpslength = Math.floor(this.HeightSegments/4);
    var lerps = [];
    for(var i = 0;i<2*lerpslength+1;i++){
        var lerpvalue = 0;
        if(i > lerpslength){
            lerpvalue = (2*lerpslength-i+1)/(lerpslength+1);
        }
        else{
            lerpvalue = (i+1)/(lerpslength+1);
        }
        lerps.push(lerpvalue); 
    }
    var percent = height/this.height;
    var index = Math.floor((this.HeightSegments-1)*percent);
    if((addradius>0 && this.SegmentParam[index].outR >= this.maxRadius) || (addradius<=0 && this.SegmentParam[index].outR<= this.minRadius)){
        return;
    }
    var add = 0;
    for(var i = -lerpslength;i<lerpslength+1;i++){
        if(index+i < 0 || index +i >= this.HeightSegments){
            continue;
        }
        var changesegparam = this.SegmentParam[index+i];
        var lerp = lerps[i+lerpslength];
        if(addradius > 0){
            if(lerp*addradius > this.maxRadius-changesegparam.outR){
                add = this.maxRadius-changesegparam.outR;
            }
            else
            {
                add = lerp*addradius;    
            }
            changesegparam.outR += add;
            changesegparam.innerR += add;
        }else{
            if(lerp*addradius < this.minRadius-changesegparam.outR){
                add =this.minRadius-changesegparam.outR;
            }
            else
            {
                add = lerp*addradius;
            }
            changesegparam.outR += add;
            changesegparam.innerR += add;
        }
        var innerindex = ((index+i)*this.WidthSegments+1)*3,
            outindex = ((this.HeightSegments*2-(index+i)-1)*this.WidthSegments+1)*3;

       
        for(var j = 0;j<this.WidthSegments;j++)
        {
            var thi = j/this.WidthSegments*Math.PI*2,
                sin = Math.sin(thi),
                cos = Math.cos(thi);
            this.positions[innerindex+j*3] = changesegparam.innerR*cos;
            this.positions[innerindex+j*3+2] = changesegparam.innerR*sin;
            this.positions[outindex+j*3] = changesegparam.outR*cos;
            this.positions[outindex+j*3+2] = changesegparam.outR*sin;   
        }
    }
    var start = index-lerpslength-1 < 0 ? 0: (index-lerpslength-1),
        end = index+lerpslength+1 > this.HeightSegments-1 ? (this.HeightSegments -1): (index+lerpslength+1);
    this.UploadPointsToMesh(start,end);
};

PotteryModel.prototype.HeightUpdatePoints = function(addheight){
    
    if(addheight > 0) 
    {
        if(this.height >= this.maxHeight)
        {
            return;
        }
        if(addheight > this.maxHeight-this.height)
        {
            this.height = this.maxHeight;
        }
        else
        {
            this.height += addheight;    
        }
    }
    else
    {
        if(this.height <= this.minHeight)
        {
            return;
        }
        if(addheight < this.minHeight-this.height)
        {
            this.height = this.minHeight;
        }
        else
        {
            this.height += addheight;    
        }
    }
    for(var i =0;i<this.HeightSegments;i++){
       var changesegmentparam =  this.SegmentParam[i];
       changesegmentparam.innerH = this.Thickness +(this.height-this.Thickness)*i /(this.HeightSegments-1);
       changesegmentparam.outH = this.height*i/(this.HeightSegments-1);
    }
    for(var i =0;i<this.HeightSegments;i++)
    {
        var innerH = this.SegmentParam[i].innerH,
            outH = this.SegmentParam[i].outH;
        for(var j = 0;j<this.WidthSegments;j++)
        {
            var innerindex = (i*this.WidthSegments+1)*3,
                outindex = ((this.HeightSegments*2-i-1)*this.WidthSegments+1)*3;
            this.positions[innerindex+j*3+1] = innerH;
            this.positions[outindex+j*3+1] = outH;
        }
    }
    this.UploadPointsToMesh(0,this.HeightSegments-1);
};

PotteryModel.prototype.UploadPointsToMesh = function(start,end){
    this.normals = pc.calculateNormals(this.positions,this.indices);
    this.tangents = pc.calculateTangents(this.positions,this.normals,this.uvs,this.indices);
    var x = 0, y = 0,z = 0,w = 0,
        i = 0, j = 0;
    for( i = start;i<end;i++){
        
        var positions = [],normals = [],tangents = [];
        //addinnerpoints
        var startindex = i*this.WidthSegments+1;
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[startindex*3];
                 y = this.positions[startindex*3+1];
                 z = this.positions[startindex*3+2];
                 positions.push(x,y,z);
                 x = this.normals[startindex*3];
                 y = this.normals[startindex*3+1];
                 z = this.normals[startindex*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[startindex*4];
                 y = this.tangents[startindex*4+1];
                 z = this.tangents[startindex*4+2];
                 w = this.tangents[startindex*4+3];
                 tangents.push(x,y,z,w); 

                 break;
            }
            x = this.positions[(startindex+j)*3];
            y = this.positions[(startindex+j)*3+1];
            z = this.positions[(startindex+j)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j)*3];
            y = this.normals[(startindex+j)*3+1];
            z = this.normals[(startindex+j)*3+2];
            normals.push(x,y,z);
            x = this.tangents[startindex*4];
            y = this.tangents[startindex*4+1];
            z = this.tangents[startindex*4+2];
            w = this.tangents[startindex*4+3];
            tangents.push(x,y,z,w);

        }
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[(startindex+this.WidthSegments)*3];
                 y = this.positions[(startindex+this.WidthSegments)*3+1];
                 z = this.positions[(startindex+this.WidthSegments)*3+2];
                 positions.push(x,y,z);
                 x = this.normals[(startindex+this.WidthSegments)*3];
                 y = this.normals[(startindex+this.WidthSegments)*3+1];
                 z = this.normals[(startindex+this.WidthSegments)*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[(startindex+this.WidthSegments)*4];
                 y = this.tangents[(startindex+this.WidthSegments)*4+1];
                 z = this.tangents[(startindex+this.WidthSegments)*4+2];
                 w = this.tangents[(startindex+this.WidthSegments)*4+3];
                 tangents.push(x,y,z,w);

                 break;
            }
            x = this.positions[(startindex+j+this.WidthSegments)*3];
            y = this.positions[(startindex+j+this.WidthSegments)*3+1];
            z = this.positions[(startindex+j+this.WidthSegments)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j+this.WidthSegments)*3];
            y = this.normals[(startindex+j+this.WidthSegments)*3+1];
            z = this.normals[(startindex+j+this.WidthSegments)*3+2];
            normals.push(x,y,z);
            x = this.tangents[(startindex+this.WidthSegments)*4];
            y = this.tangents[(startindex+this.WidthSegments)*4+1];
            z = this.tangents[(startindex+this.WidthSegments)*4+2];
            w = this.tangents[(startindex+this.WidthSegments)*4+3];
            tangents.push(x,y,z,w);

        }
        //addoutpoints
        startindex = (2*this.HeightSegments-i-2)*this.WidthSegments+1;
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[(startindex+this.WidthSegments)*3];
                 y = this.positions[(startindex+this.WidthSegments)*3+1];
                 z = this.positions[(startindex+this.WidthSegments)*3+2];
                 positions.push(x,y,z);
                 x = this.normals[(startindex+this.WidthSegments)*3];
                 y = this.normals[(startindex+this.WidthSegments)*3+1];
                 z = this.normals[(startindex+this.WidthSegments)*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[(startindex+this.WidthSegments)*4];
                 y = this.tangents[(startindex+this.WidthSegments)*4+1];
                 z = this.tangents[(startindex+this.WidthSegments)*4+2];
                 w = this.tangents[(startindex+this.WidthSegments)*4+3];
                 tangents.push(x,y,z,w);
                 break;
            }
            x = this.positions[(startindex+j+this.WidthSegments)*3];
            y = this.positions[(startindex+j+this.WidthSegments)*3+1];
            z = this.positions[(startindex+j+this.WidthSegments)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j+this.WidthSegments)*3];
            y = this.normals[(startindex+j+this.WidthSegments)*3+1];
            z = this.normals[(startindex+j+this.WidthSegments)*3+2];
            normals.push(x,y,z);
            x = this.tangents[(startindex+this.WidthSegments)*4];
            y = this.tangents[(startindex+this.WidthSegments)*4+1];
            z = this.tangents[(startindex+this.WidthSegments)*4+2];
            w = this.tangents[(startindex+this.WidthSegments)*4+3];
            tangents.push(x,y,z,w);

        }
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[startindex*3];
                 y = this.positions[startindex*3+1];
                 z = this.positions[startindex*3+2];
                 positions.push(x,y,z);
                 x = this.normals[startindex*3];
                 y = this.normals[startindex*3+1];
                 z = this.normals[startindex*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[startindex*4];
                 y = this.tangents[startindex*4+1];
                 z = this.tangents[startindex*4+2];
                 w = this.tangents[startindex*4+3];
                 tangents.push(x,y,z,w);
                 break;
            }
            x = this.positions[(startindex+j)*3];
            y = this.positions[(startindex+j)*3+1];
            z = this.positions[(startindex+j)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j)*3];
            y = this.normals[(startindex+j)*3+1];
            z = this.normals[(startindex+j)*3+2];
            normals.push(x,y,z);
            x = this.tangents[startindex*4];
            y = this.tangents[startindex*4+1];
            z = this.tangents[startindex*4+2];
            w = this.tangents[startindex*4+3];
            tangents.push(x,y,z,w);
        }
        var mesh = this.allmeshes[i];
        mesh.positions = positions;
        mesh.normals = normals;
        //var tangents = pc.calculateTangents(positions,normals,mesh.uvs,mesh.indices);
        mesh.tangents = tangents;
        
        var vertexBuffer = mesh.mesh.vertexBuffer;
        var iterator = new pc.VertexIterator(vertexBuffer);
        var numVertices = vertexBuffer.numVertices;
        for ( j = 0;j < numVertices;j++) {
            iterator.element[pc.SEMANTIC_POSITION].set(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
            iterator.element[pc.SEMANTIC_NORMAL].set(normals[j * 3], normals[j * 3 + 1], normals[j * 3 + 2]);
            iterator.element[pc.SEMANTIC_TANGENT].set(tangents[j * 4], tangents[j * 4 + 1], tangents[j * 4 + 2],tangents[j * 4 + 3]);
            iterator.next();
        }
        iterator.end();
    }
   
};


PotteryModel.prototype.CreateMeshInstances = function(){
    
    this.mats = [];
    var device = this.app.graphicsDevice;
    var mgraphnode = new pc.GraphNode();
    var meshInstances = [];
    
    this.allmeshes = [];
    this.matsdata = [];
    
    var indices = [];
    var index1 = 0,index2 = 0,index3 = 0,
        x = 0, y = 0,z = 0,w = 0,
        i = 0, j = 0; 
    //add inner indices
    for( i = 0;i<this.WidthSegments;i++)
    {
        index3 = i+1;
        index2 = this.WidthSegments + 1 + i;
        index1 = i;    
        indices.push(index3,index2,index1);
        
        index3 = i+1;
        index2 = this.WidthSegments +1 +i+1;
        index1 = this.WidthSegments + 1 + i;
        indices.push(index3,index2,index1);   
    }
   
    //add out indices
    for( i = 0;i<this.WidthSegments;i++)
    {
        index1 = 2*(this.WidthSegments+1)+i;
        index2 = 3*(this.WidthSegments+1)+i;
        index3 = 3*(this.WidthSegments +1)+ i+1;
        indices.push(index1,index2,index3);
        
        index1 = 2*(this.WidthSegments +1)+i;
        index2 = 3*(this.WidthSegments +1)+i+1;
        index3 = 2*(this.WidthSegments +1) +i+1;
        indices.push(index1,index2,index3);   
    }

    var repeatu = 1,repeatv = 1;
    //cylindermesh
    for( i = 0;i<this.HeightSegments-1;i++){
        
        var positions = [],normals = [],tangents = [];
        var uvs = [],uvs1 = [];
        //addinnerpoints
        var startindex = i*this.WidthSegments+1;
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[startindex*3];
                 y = this.positions[startindex*3+1];
                 z = this.positions[startindex*3+2];
                 positions.push(x,y,z);
                 x = this.normals[startindex*3];
                 y = this.normals[startindex*3+1];
                 z = this.normals[startindex*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[startindex*4];
                 y = this.tangents[startindex*4+1];
                 z = this.tangents[startindex*4+2];
                 w = this.tangents[startindex*4+3];
                 tangents.push(x,y,z,w); 

                 uvs.push(j/this.WidthSegments*repeatu,i/(this.HeightSegments-1)*repeatv);
                 uvs1.push(j/this.WidthSegments*repeatu,i/(this.HeightSegments-1)*repeatv);
                 break;
            }
            x = this.positions[(startindex+j)*3];
            y = this.positions[(startindex+j)*3+1];
            z = this.positions[(startindex+j)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j)*3];
            y = this.normals[(startindex+j)*3+1];
            z = this.normals[(startindex+j)*3+2];
            normals.push(x,y,z);
            x = this.tangents[startindex*4];
            y = this.tangents[startindex*4+1];
            z = this.tangents[startindex*4+2];
            w = this.tangents[startindex*4+3];
            tangents.push(x,y,z,w);
            uvs.push(j/this.WidthSegments*repeatu,i/(this.HeightSegments-1)*repeatv);
            uvs1.push(j/this.WidthSegments*repeatu,i/(this.HeightSegments-1)*repeatv);
        }
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[(startindex+this.WidthSegments)*3];
                 y = this.positions[(startindex+this.WidthSegments)*3+1];
                 z = this.positions[(startindex+this.WidthSegments)*3+2];
                 positions.push(x,y,z);
                 x = this.normals[(startindex+this.WidthSegments)*3];
                 y = this.normals[(startindex+this.WidthSegments)*3+1];
                 z = this.normals[(startindex+this.WidthSegments)*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[(startindex+this.WidthSegments)*4];
                 y = this.tangents[(startindex+this.WidthSegments)*4+1];
                 z = this.tangents[(startindex+this.WidthSegments)*4+2];
                 w = this.tangents[(startindex+this.WidthSegments)*4+3];
                 tangents.push(x,y,z,w);
                 uvs.push(j/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
                 uvs1.push(j/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
                 break;
            }
            x = this.positions[(startindex+j+this.WidthSegments)*3];
            y = this.positions[(startindex+j+this.WidthSegments)*3+1];
            z = this.positions[(startindex+j+this.WidthSegments)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j+this.WidthSegments)*3];
            y = this.normals[(startindex+j+this.WidthSegments)*3+1];
            z = this.normals[(startindex+j+this.WidthSegments)*3+2];
            normals.push(x,y,z);
            x = this.tangents[(startindex+this.WidthSegments)*4];
            y = this.tangents[(startindex+this.WidthSegments)*4+1];
            z = this.tangents[(startindex+this.WidthSegments)*4+2];
            w = this.tangents[(startindex+this.WidthSegments)*4+3];
            tangents.push(x,y,z,w);
            uvs.push(j/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
            uvs1.push(j/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
        }
        //addoutpoints
        startindex = (2*this.HeightSegments-i-2)*this.WidthSegments+1;
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[(startindex+this.WidthSegments)*3];
                 y = this.positions[(startindex+this.WidthSegments)*3+1];
                 z = this.positions[(startindex+this.WidthSegments)*3+2];
                 positions.push(x,y,z);
                 x = this.normals[(startindex+this.WidthSegments)*3];
                 y = this.normals[(startindex+this.WidthSegments)*3+1];
                 z = this.normals[(startindex+this.WidthSegments)*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[(startindex+this.WidthSegments)*4];
                 y = this.tangents[(startindex+this.WidthSegments)*4+1];
                 z = this.tangents[(startindex+this.WidthSegments)*4+2];
                 w = this.tangents[(startindex+this.WidthSegments)*4+3];
                 tangents.push(x,y,z,w);
                 uvs.push((this.WidthSegments -j)/(this.HeightSegments-1)*repeatu,i/(this.HeightSegments-1)*repeatv);
                 uvs1.push((this.WidthSegments -j)/(this.HeightSegments-1)*repeatu,i/(this.HeightSegments-1)*repeatv);
                 break;
            }
            x = this.positions[(startindex+j+this.WidthSegments)*3];
            y = this.positions[(startindex+j+this.WidthSegments)*3+1];
            z = this.positions[(startindex+j+this.WidthSegments)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j+this.WidthSegments)*3];
            y = this.normals[(startindex+j+this.WidthSegments)*3+1];
            z = this.normals[(startindex+j+this.WidthSegments)*3+2];
            normals.push(x,y,z);
            x = this.tangents[(startindex+this.WidthSegments)*4];
            y = this.tangents[(startindex+this.WidthSegments)*4+1];
            z = this.tangents[(startindex+this.WidthSegments)*4+2];
            w = this.tangents[(startindex+this.WidthSegments)*4+3];
            tangents.push(x,y,z,w);
            uvs.push((this.WidthSegments-j)/this.WidthSegments*repeatu,i/(this.HeightSegments-1)*repeatv);
            uvs1.push((this.WidthSegments-j)/this.WidthSegments*repeatu,i/(this.HeightSegments-1)*repeatv);
        }
        for( j =0;j<this.WidthSegments+1;j++)
        {
            if(j === this.WidthSegments)
            {
                 x = this.positions[startindex*3];
                 y = this.positions[startindex*3+1];
                 z = this.positions[startindex*3+2];
                 positions.push(x,y,z);
                 x = this.normals[startindex*3];
                 y = this.normals[startindex*3+1];
                 z = this.normals[startindex*3+2];
                 normals.push(x,y,z);
                 x = this.tangents[startindex*4];
                 y = this.tangents[startindex*4+1];
                 z = this.tangents[startindex*4+2];
                 w = this.tangents[startindex*4+3];
                 tangents.push(x,y,z,w);
                 uvs.push((this.WidthSegments -j)/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
                 uvs1.push((this.WidthSegments -j)/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
                 break;
            }
            x = this.positions[(startindex+j)*3];
            y = this.positions[(startindex+j)*3+1];
            z = this.positions[(startindex+j)*3+2];
            positions.push(x,y,z);
            x = this.normals[(startindex+j)*3];
            y = this.normals[(startindex+j)*3+1];
            z = this.normals[(startindex+j)*3+2];
            normals.push(x,y,z);
            x = this.tangents[startindex*4];
            y = this.tangents[startindex*4+1];
            z = this.tangents[startindex*4+2];
            w = this.tangents[startindex*4+3];
            tangents.push(x,y,z,w);
            uvs.push((this.WidthSegments-j)/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
            uvs1.push((this.WidthSegments-j)/this.WidthSegments*repeatu,(i+1)/(this.HeightSegments-1)*repeatv);
        }
        //var tangents = pc.calculateTangents(positions,normals,indices,uvs);
        var mesh = this.createMesh(device,positions,{indices:indices,normals:normals,tangents:tangents,uvs:uvs,uvs1:uvs1});
        this.allmeshes.push({mesh:mesh,positions:positions,indices:indices,normals:normals,tangents:tangents,uvs:uvs,uvs1:uvs1});
        this.matsdata.push({c:'',dtex:'',ntex:'',bumpniness:0.6,tex1:''});
        var graphnode = new pc.GraphNode();
        mgraphnode.addChild(graphnode);
        var mat = this.CreateMaterial();
        this.mats.push(mat);
        var meshinstance = new pc.MeshInstance(graphnode,mesh,mat);
        meshInstances.push(meshinstance);
    }
    var model = new pc.Model();
    model.graph = mgraphnode;
    model.meshInstances = meshInstances;
    this.entity.model.model = model;
};

PotteryModel.prototype.UploadUV1ToMesh = function(index,length){
    var repeatu = 4;
    for(var i = 0;i<length;i++)
    {
        if(index+i >= this.HeightSegments-1){
            return;
        }
        var uvs1 = [];

        for( j =0;j<this.WidthSegments+1;j++)
        {
            uvs1.push(j/this.WidthSegments*repeatu,i/length);
        }
        for( j =0;j<this.WidthSegments+1;j++)
        {
            uvs1.push(j/this.WidthSegments*repeatu,(i+1)/length);
        }

        for( j =0;j<this.WidthSegments+1;j++)
        {
            uvs1.push((this.WidthSegments-j)/this.WidthSegments*repeatu,i/length);
        }
        for( j =0;j<this.WidthSegments+1;j++)
        {
            uvs1.push((this.WidthSegments-j)/this.WidthSegments*repeatu,(i+1)/length);
        }
        var mesh = this.allmeshes[index+i];
        mesh.uvs1 = uvs1;
        var vertexBuffer = mesh.mesh.vertexBuffer;
        var iterator = new pc.VertexIterator(vertexBuffer);
        var numVertices = vertexBuffer.numVertices;
        for ( j = 0;j < numVertices;j++) 
        {
            iterator.element[pc.SEMANTIC_TEXCOORD1].set(uvs1[j * 2], uvs1[j * 2 + 1]);
            iterator.next();
        }
        iterator.end();
    }
};

PotteryModel.prototype.CheckOutOrInner = function(x,y){
    
    if(y<0)
    {
        return -1;
    }
    
    if(y>this.height)
    {
       return PotteryModel.ClickPoint.TopOut; 
    }
    else
    {
        var percent = y/this.height;
        var index = Math.floor((this.HeightSegments-1)*percent);
        var changesegparam = this.SegmentParam[index];
        if(x >changesegparam.outR)
        {
            return PotteryModel.ClickPoint.RightOut;
        }
        if(x < -changesegparam.outR)
        {
            return PotteryModel.ClickPoint.LeftOut;
        }
    }
    return PotteryModel.ClickPoint.Inner;
};

PotteryModel.prototype.CheckHeightPos = function(x,y){
    if(y<0 || y>this.height)
    {
        return -1;
    }
    else
    {
        var percent = y/this.height;
        var index = Math.floor((this.HeightSegments-1)*percent);
        var changesegparam = this.SegmentParam[index];
        if(x >changesegparam.outR)
        {
            return -1;
        }
        else
        {
            if(x < -changesegparam.outR)
            {
                return -1;
            }
            else
            {
                return index;
            }
        }
        
    }
};