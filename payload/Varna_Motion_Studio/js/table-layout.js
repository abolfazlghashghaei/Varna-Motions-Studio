(function(root){
function tableDividers(rows,cols,merges,direction){
 var out=[],xs=[0],ys=[0],total=0,i,j,m;
 for(i=0;i<cols.length;i++)total+=Number(cols[i]);for(i=0;i<cols.length;i++)xs.push(xs[i]+Number(cols[i])/total);
 total=0;for(i=0;i<rows.length;i++)total+=Number(rows[i]);for(i=0;i<rows.length;i++)ys.push(ys[i]+Number(rows[i])/total);
 function visible(axis,boundary,slot){for(var k=0;k<merges.length;k++){m=merges[k];if(axis==='h'&&boundary>m.r&&boundary<m.r+m.rs&&slot>=m.c&&slot<m.c+m.cs)return false;if(axis==='v'&&boundary>m.c&&boundary<m.c+m.cs&&slot>=m.r&&slot<m.r+m.rs)return false;}return true;}
 function x(v){return direction==='rtl'?1-v:v;}
 for(i=1;i<rows.length;i++){var begin=-1;for(j=0;j<=cols.length;j++){var show=j<cols.length&&visible('h',i,j);if(show&&begin<0)begin=j;if(!show&&begin>=0){out.push([x(xs[begin]),ys[i],x(xs[j]),ys[i]]);begin=-1;}}}
 for(i=1;i<cols.length;i++){var first=-1;for(j=0;j<=rows.length;j++){var on=j<rows.length&&visible('v',i,j);if(on&&first<0)first=j;if(!on&&first>=0){out.push([x(xs[i]),ys[first],x(xs[i]),ys[j]]);first=-1;}}}return out;
}
root.VarnaTableDividers=tableDividers;
})(this);
