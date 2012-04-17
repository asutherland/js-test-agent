(function(window){
  function MochaDriver (options) {
    var key;

    if(typeof(options) === 'undefined'){
      options = {};
    }

    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
  }

  MochaDriver.createMutliReporter = function(){
    var reporters = Array.prototype.slice.call(arguments);

    return function(runner){
      reporters.forEach(function(Report){
        new Report(runner);
      });
    };
  };

  MochaDriver.prototype = {
    ui: 'bdd',
    testHelperUrl: './test/helper.js',
    mochaUrl: './vendor/mocha/mocha.js',

    enhance: function(worker){
      this.worker = worker;
      worker.testRunner = this._testRunner.bind(this);
      worker.on('run tests', this._onRunTests.bind(this));
    },

    _onRunTests: function(data){
      this.worker.runTests(data.tests || []);
    },

    getReporter: function(box){
      var stream = TestAgent.Mocha.JsonStreamReporter,
          self = this;

      stream.console = box.console;

      stream.send = function(line){
        self.worker.send('test data', line);
      };

      return MochaDriver.createMutliReporter(
        TestAgent.Mocha.JsonStreamReporter,
        box.mocha.reporters.HTML
      );
    },

    _testRunner: function(worker, tests, done){
      var box = worker.sandbox.getWindow(),
          self = this;

      worker.loader.done(function(){
        box.mocha.run(done);
      });

      box.require(this.mochaUrl, function(){
        //setup mocha
        box.mocha.setup({
          ui: self.ui,
          reporter: self.getReporter(box)
        });
      });

      box.require(this.testHelperUrl);

      tests.forEach(function(test){
        box.require(test);
      });
    }

  };

  window.TestAgent.BrowserWorker.MochaDriver = MochaDriver;

}(this));