let pathTrace = null;

class PathTrace {
    constructor(){
        this.targets = $('.path-trace');
        $(this.targets).each((i,target)=>{
            this.BuildPaths(target);
        }); 
    }
    

    TriggerTarget(targets){
        $(targets).each((i,target)=>{
            console.log(target);
            const paths = $(target).find('line');
            paths.each((i, path)=>{
                $(path).addClass("start-path-trace");
            });
        });
    }
    
    BuildPaths(target){
        const paths = $(target).find('line');
        paths.each((i, path)=>{
            const l = $(path)[0].getTotalLength();
            console.log(path);
            $(path)[0].style.setProperty('--offset', l);
        });
    }
}


document.addEventListener("DOMContentLoaded",()=>{
    pathTrace = new PathTrace();
});