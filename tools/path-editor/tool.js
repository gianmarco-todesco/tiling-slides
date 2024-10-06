"use strict";

class Tool {
    constructor() {}
    getWorldPos(e) {
        return app.stage.localTransform.clone().invert().apply(e.global);
    }
    pointerDown(e) {}
    keyDown(e) {}
    drag(callback) {
        function onDrag(e) {
            callback(e);
        }
        function dragEnd(e) {
            app.stage.off('globalpointermove', onDrag)
            app.stage.off('pointerup', dragEnd)
            app.stage.off('pointerupoutside', dragEnd)
        }
        app.stage.on('globalpointermove', onDrag)
        app.stage.on('pointerup', dragEnd)
        app.stage.on('pointerupoutside', dragEnd)
        
    }
}
