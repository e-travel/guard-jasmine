/* source: https://github.com/larrymyers/jasmine-reporters */

/* The MIT License

 Copyright (c) 2010 Larry Myers

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE. */

(function() {
    if (! jasmine) {
        throw new Exception("jasmine library does not exist in global namespace!");
    }

    /**
     * Basic reporter that outputs spec results to for the Teamcity build system
     *
     * Usage:
     *
     * jasmine.getEnv().addReporter(new jasmine.TeamcityReporter());
     * jasmine.getEnv().execute();
     */
    var TeamcityReporter = function() {
        this.started = false;
        this.finished = false;
    };

    TeamcityReporter.prototype = {
        reportRunnerResults: function(runner) { },

        reportRunnerStarting: function(runner) { },

        reportSpecResults: function(spec) { },

        reportSpecStarting: function(spec) { },

        reportSuiteResults: function(suite) {
            var results = suite.results();
            var path = [];
            while(suite) {
                path.unshift(suite.description);
                suite = suite.parentSuite;
            }
            var description = path.join(' ');

            this.log("##teamcity[testSuiteStarted name='" + this.escapeTeamcityString(description) + "']");

            var outerThis = this;
            var eachSpecFn = function(spec){
                if (spec.description) {
                    outerThis.log("##teamcity[testStarted name='" + outerThis.escapeTeamcityString(spec.description) + "' captureStandardOutput='true']");
                    var specResultFn = function(result){
                        if (!result.passed_) {
                            outerThis.log("##teamcity[testFailed name='" + outerThis.escapeTeamcityString(spec.description) + "' message='|[FAILED|]' details='" + outerThis.escapeTeamcityString(result.trace.stack) + "']");
                        }
                    };

                    for (var j = 0, jlen = spec.items_.length; j < jlen; j++) {
                        specResultFn(spec.items_[j]);
                    }
                    outerThis.log("##teamcity[testFinished name='" + outerThis.escapeTeamcityString(spec.description) + "']");
                }
            };
            for (var i = 0, ilen = results.items_.length; i < ilen; i++) {
                eachSpecFn(results.items_[i]);
            }



            this.log("##teamcity[testSuiteFinished name='" + outerThis.escapeTeamcityString(description) + "']");
        },

        log: function(str) {
            var console = jasmine.getGlobal().console;
            if (console && console.log) {
                console.log(str);
            }
        },

        hasGroupedConsole: function() {
            var console = jasmine.getGlobal().console;
            return console && console.info && console.warn && console.group && console.groupEnd && console.groupCollapsed;
        },

        escapeTeamcityString: function(message) {
            if(!message) {
                return "";
            }

            return message.replace(/\|/g, "||")
                .replace(/\'/g, "|'")
                .replace(/\n/g, "|n")
                .replace(/\r/g, "|r")
                .replace(/\u0085/g, "|x")
                .replace(/\u2028/g, "|l")
                .replace(/\u2029/g, "|p")
                .replace(/\[/g, "|[")
                .replace(/]/g, "|]");
        }
    };

    function suiteResults(suite) {
        console.group(suite.description);
        var specs = suite.specs();
        for (var i in specs) {
            if (specs.hasOwnProperty(i)) {
                specResults(specs[i]);
            }
        }
        var suites = suite.suites();
        for (var j in suites) {
            if (suites.hasOwnProperty(j)) {
                suiteResults(suites[j]);
            }
        }
        console.groupEnd();
    }

    function specResults(spec) {
        var results = spec.results();
        if (results.passed() && console.groupCollapsed) {
            console.groupCollapsed(spec.description);
        } else {
            console.group(spec.description);
        }
        var items = results.getItems();
        for (var k in items) {
            if (items.hasOwnProperty(k)) {
                itemResults(items[k]);
            }
        }
        console.groupEnd();
    }

    function itemResults(item) {
        if (item.passed && !item.passed()) {
            console.warn({actual:item.actual,expected: item.expected});
            item.trace.message = item.matcherName;
            console.error(item.trace);
        } else {
            console.info('Passed');
        }
    }

    // export public
    jasmine.TeamcityReporter = TeamcityReporter;
})();
