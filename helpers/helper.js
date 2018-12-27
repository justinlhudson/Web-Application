let self = module.exports = {
  normalizeInt: (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
      // named pipe
      return val;
    }
    if (port >= 0) {
      // port number
      return port;
    }
    return false;
  },

  msleep: (n) => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
  },

  sleep: (n) => {
    self.msleep(n*1000);
  },

  isEmpty: (data) => {
    if(typeof(data) === 'object'){
      if(JSON.stringify(data) === '{}' || JSON.stringify(data) === '[]'){
        return true;
      }else if(!data){
        return true;
      }
      return false;
    }else if(typeof(data) === 'string'){
      if(!data.trim()){
        return true;
      }
      return false;
    }else if(typeof(data) === 'undefined'){
      return true;
    }else{
      return false;
    }
  }

};