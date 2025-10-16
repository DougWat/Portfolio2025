function SVGAnim(){
    const framerate = 10;
    const frameMillisecond = 1000/framerate;

    let frameTime = Date.now();
    
    let svgAnimItems = [];
    $('.svg-anim-js').each((i,item)=>{
        svgAnimItems.push(new SVGAnimItem(item));
    });

    
    function RunAnimation(){
        if(Date.now() - frameTime > frameMillisecond){
            svgAnimItems.forEach((item)=>{
                item.AdvFrame();
            });
            frameTime = Date.now();
        }
        requestAnimationFrame(RunAnimation);
    }
    RunAnimation()
}

function SVGAnimItem(elm){
    const frames = $(elm).find('g');
    const maxFrames = $(frames).length;
    let currentFrame = 0;

    function ShowCurrentFrame(){
        $(frames).removeClass('show');
        $(frames).eq(currentFrame).addClass('show');
    }

    this.AdvFrame = function(){
        currentFrame = (currentFrame + 1) % maxFrames;
        ShowCurrentFrame();
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    SVGAnim();
});