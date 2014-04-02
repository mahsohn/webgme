define(["jszip",'plugin/PluginFSBase','fs','path'],function(ZIP,PluginFSBase,FS, Path){



    function PluginFSServer(parameters){
        PluginFSBase.call(this, parameters);
    }

    PluginFSServer.extends(PluginFSBase);

    PluginFSServer.prototype.constructor = PluginFSServer;

    PluginFSServer.prototype.createArtifact = function(name){
        if(this._artifactName === null){
            this._artifactName = name;
            this._artifactZip = ZIP();
            return true;
        } else {
            return false;
        }
    };

    PluginFSServer.prototype.saveArtifact = function(){
        // FIXME: Windows cannot extract compressed zip packages with 'DEFLATE' flag, 7-zip can
        //var data = this._artifactZip.generate({base64:false,compression:'DEFLATE'});
        var data = this._artifactZip.generate({base64:false});
        try {
            FS.writeFileSync(Path.join(this._parameters.outputpath, this._artifactName + ".zip"), data, 'binary');
            this._artifactName = null;
            this._artifactZip = null;
            return true;
        } catch (e) {
            this._artifactName = null;
            this._artifactZip = null;
            return false;
        }
    };

    PluginFSServer.prototype.addFile = function(path,data){
        if(this._artifactName !== null){
            this._artifactZip.file(path,data);
            return true;
        } else {
            return false;
        }
    };

    return PluginFSServer;
});