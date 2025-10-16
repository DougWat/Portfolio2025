class Rotato{
    constructor(){
        this.items = [];
        $(".rotato").each((i,item)=>{
            this.items.push(new RotatoItem(item));
        });
    }

}

class RotatoItem{
    constructor(section){
        this.section = section;
        $(this.section)[0].style.setProperty('--x-div', 0);
        $(this.section)[0].style.setProperty('--y-div', 0);
        $(this.section).attr('data-xDiv',0);
        $(this.section).attr('data-yDiv',0);
        this.allow = true;
        this.sectionRect = $(this.section)[0].getBoundingClientRect();
        this.sectionWidth;
        this.sectionHeight;
        this.sectionWidthHalf;
        this.sectionHeightHalf;

        this.SetSectionDimensions();

        $(this.section)[0].onmousemove = (e)=>{
            if(!this.allow){return;}
            this.SetSectionDimensions();
            const x1 = e.clientX - this.sectionRect.left;
            const y1 = e.clientY - this.sectionRect.top;
        
            const x = (x1 - this.sectionWidthHalf)/this.sectionWidthHalf;
            const y = (y1 - this.sectionHeightHalf)/this.sectionHeightHalf;
        
            $(this.section)[0].style.setProperty('--x-div', x);
            $(this.section)[0].style.setProperty('--y-div', y);
            $(this.section).attr('data-xDiv',x);
            $(this.section).attr('data-yDiv',y);
            this.allow = false;
            setTimeout(()=>{this.allow=true;},60);
          }
        $(this.section)[0].onmouseleave = (e)=>{
            $(this.section)[0].style.setProperty('--x-div', 0);
            $(this.section)[0].style.setProperty('--y-div', 0);
            $(this.section).attr('data-xDiv',0);
            $(this.section).attr('data-yDiv',0);
        }
    }

    SetSectionDimensions(){
        this.sectionRect = $(this.section)[0].getBoundingClientRect();
        this.sectionWidth = this.sectionRect.width;
        this.sectionHeight = this.sectionRect.height;
        this.sectionWidthHalf = this.sectionWidth/2;
        this.sectionHeightHalf = this.sectionHeight/2;
    }
    
}

let rotato;
document.addEventListener("DOMContentLoaded",()=>{rotato = new Rotato});