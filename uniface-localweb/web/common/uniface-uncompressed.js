//! moment.js
//! version : 2.9.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {
    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = '2.9.0',
        // the global-scope this is NOT the global object in Node.js
        globalScope = (typeof global !== 'undefined' && (typeof window === 'undefined' || window === global.window)) ? global : this,
        oldGlobalMoment,
        round = Math.round,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for locale config files
        locales = {},

        // extra moment internal properties (plugins register props here)
        momentProperties = [],

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenOffsetMs = /[\+\-]?\d+/, // 1234567890123
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker '+10:00' > ['10', '00'] or '-1530' > ['-', '15', '30']
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // default relative time thresholds
        relativeTimeThresholds = {
            s: 45,  // seconds to minute
            m: 45,  // minutes to hour
            h: 22,  // hours to day
            d: 26,  // days to month
            M: 11   // months to year
        },

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.localeData().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.localeData().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.localeData().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.localeData().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.localeData().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.localeData().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ':' + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = this.utcOffset(),
                    b = '+';
                if (a < 0) {
                    a = -a;
                    b = '-';
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            x    : function () {
                return this.valueOf();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        deprecations = {},

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'],

        updateInProgress = false;

    // Pick the first defined of two or three arguments. dfl comes from
    // default.
    function dfl(a, b, c) {
        switch (arguments.length) {
            case 2: return a != null ? a : b;
            case 3: return a != null ? a : b != null ? b : c;
            default: throw new Error('Implement me');
        }
    }

    function hasOwnProp(a, b) {
        return hasOwnProperty.call(a, b);
    }

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function printMsg(msg) {
        if (moment.suppressDeprecationWarnings === false &&
                typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        return extend(function () {
            if (firstTime) {
                printMsg(msg);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            printMsg(msg);
            deprecations[name] = true;
        }
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.localeData().ordinal(func.call(this, a), period);
        };
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // thie is not supposed to happen
            return hour;
        }
    }

    /************************************
        Constructors
    ************************************/

    function Locale() {
    }

    // Moment prototype object
    function Moment(config, skipOverflow) {
        if (skipOverflow !== false) {
            checkOverflow(config);
        }
        copyConfig(this, config);
        this._d = new Date(+config._d);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            moment.updateOffset(this);
            updateInProgress = false;
        }
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = moment.localeData();

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = from._pf;
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = makeAs(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = moment.duration(val, period);
            addOrSubtractDurationFromMoment(this, dur, direction);
            return this;
        };
    }

    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return Object.prototype.toString.call(input) === '[object Date]' ||
            input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment._locale[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment._locale, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 24 ||
                    (m._a[HOUR] === 24 && (m._a[MINUTE] !== 0 ||
                                           m._a[SECOND] !== 0 ||
                                           m._a[MILLISECOND] !== 0)) ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0 &&
                    m._pf.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        if (!locales[name] && hasModule) {
            try {
                oldLocale = moment.locale();
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we want to undo that for lazy loaded locales
                moment.locale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // Return a moment from input, that is local/utc/utcOffset equivalent to
    // model.
    function makeAs(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (moment.isMoment(input) || isDate(input) ?
                    +input : +moment(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            moment.updateOffset(res, false);
            return res;
        } else {
            return moment(input).local();
        }
    }

    /************************************
        Locale
    ************************************/


    extend(Locale.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
            // Lenient ordinal parsing accepts just a number in addition to
            // number + (possibly) stuff coming from _ordinalParseLenient.
            this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + /\d{1,2}/.source);
        },

        _months : 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_'),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName, format, strict) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
                this._longMonthsParse = [];
                this._shortMonthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                mom = moment.utc([2000, i]);
                if (strict && !this._longMonthsParse[i]) {
                    this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                    this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
                }
                if (!strict && !this._monthsParse[i]) {
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                    return i;
                } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                    return i;
                } else if (!strict && this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LTS : 'h:mm:ss A',
            LT : 'h:mm A',
            L : 'MM/DD/YYYY',
            LL : 'MMMM D, YYYY',
            LLL : 'MMMM D, YYYY LT',
            LLLL : 'dddd, MMMM D, YYYY LT'
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },


        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom, now) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom, [now]) : output;
        },

        _relativeTime : {
            future : 'in %s',
            past : '%s ago',
            s : 'a few seconds',
            m : 'a minute',
            mm : '%d minutes',
            h : 'an hour',
            hh : '%d hours',
            d : 'a day',
            dd : '%d days',
            M : 'a month',
            MM : '%d months',
            y : 'a year',
            yy : '%d years'
        },

        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },

        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace('%d', number);
        },
        _ordinal : '%d',
        _ordinalParse : /\d{1,2}/,

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        firstDayOfWeek : function () {
            return this._week.dow;
        },

        firstDayOfYear : function () {
            return this._week.doy;
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) {
                return parseTokenOneDigit;
            }
            /* falls through */
        case 'SS':
            if (strict) {
                return parseTokenTwoDigits;
            }
            /* falls through */
        case 'SSS':
            if (strict) {
                return parseTokenThreeDigits;
            }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return config._locale._meridiemParse;
        case 'x':
            return parseTokenOffsetMs;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return strict ? config._locale._ordinalParse : config._locale._ordinalParseLenient;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), 'i'));
            return a;
        }
    }

    function utcOffsetFromString(string) {
        string = string || '';
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = config._locale.monthsParse(input, token, config._strict);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(
                            input.match(/\d{1,2}/)[0], 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._meridiem = input;
            // config._isPm = config._locale.isPM(input);
            break;
        // HOUR
        case 'h' : // fall through to hh
        case 'hh' :
            config._pf.bigHour = true;
            /* falls through */
        case 'H' : // fall through to HH
        case 'HH' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX OFFSET (MILLISECONDS)
        case 'x':
            config._d = new Date(toInt(input));
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = utcOffsetFromString(input);
            break;
        // WEEKDAY - human
        case 'dd':
        case 'ddd':
        case 'dddd':
            a = config._locale.weekdaysParse(input);
            // if we didn't get a weekday name, mark the date as invalid
            if (a != null) {
                config._w = config._w || {};
                config._w['d'] = a;
            } else {
                config._pf.invalidWeekday = input;
            }
            break;
        // WEEK, WEEK DAY - numeric
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gggg':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = toInt(input);
            }
            break;
        case 'gg':
        case 'GG':
            config._w = config._w || {};
            config._w[token] = moment.parseTwoDigitYear(input);
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = dfl(w.GG, config._a[YEAR], weekOfYear(moment(), 1, 4).year);
            week = dfl(w.W, 1);
            weekday = dfl(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = dfl(w.gg, config._a[YEAR], weekOfYear(moment(), dow, doy).year);
            week = dfl(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = dfl(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day || normalizedInput.date,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {
        if (config._f === moment.ISO_8601) {
            parseISO(config);
            return;
        }

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._pf.bigHour === true && config._a[HOUR] <= 12) {
            config._pf.bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR],
                config._meridiem);
        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function parseISO(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be 'T' or undefined
                    config._f = isoDates[i][0] + (match[6] || ' ');
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += 'Z';
            }
            makeDateFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function makeDateFromString(config) {
        parseISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            moment.createFromInputFallback(config);
        }
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function makeDateFromInput(config) {
        var input = config._i, matched;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if ((matched = aspNetJsonRegex.exec(input)) !== null) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            dateFromConfig(config);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, locale) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = locale.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(posNegDuration, withoutSuffix, locale) {
        var duration = moment.duration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            years = round(duration.as('y')),

            args = seconds < relativeTimeThresholds.s && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < relativeTimeThresholds.m && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < relativeTimeThresholds.h && ['hh', hours] ||
                days === 1 && ['d'] ||
                days < relativeTimeThresholds.d && ['dd', days] ||
                months === 1 && ['M'] ||
                months < relativeTimeThresholds.M && ['MM', months] ||
                years === 1 && ['y'] || ['yy', years];

        args[2] = withoutSuffix;
        args[3] = +posNegDuration > 0;
        args[4] = locale;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        d = d === 0 ? 7 : d;
        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f,
            res;

        config._locale = config._locale || moment.localeData(config._l);

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (moment.isMoment(input)) {
            return new Moment(input, true);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        res = new Moment(config);
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    moment = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = locale;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return moment();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    moment.min = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    };

    moment.max = function () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    };

    // creating with utc
    moment.utc = function (input, format, locale, strict) {
        var c;

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso,
            diffRes;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' &&
                ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(moment(duration.from), moment(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // constant that refers to the ISO standard
    moment.ISO_8601 = function () {};

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function allows you to set a threshold for relative time strings
    moment.relativeTimeThreshold = function (threshold, limit) {
        if (relativeTimeThresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return relativeTimeThresholds[threshold];
        }
        relativeTimeThresholds[threshold] = limit;
        return true;
    };

    moment.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        function (key, value) {
            return moment.locale(key, value);
        }
    );

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    moment.locale = function (key, values) {
        var data;
        if (key) {
            if (typeof(values) !== 'undefined') {
                data = moment.defineLocale(key, values);
            }
            else {
                data = moment.localeData(key);
            }

            if (data) {
                moment.duration._locale = moment._locale = data;
            }
        }

        return moment._locale._abbr;
    };

    moment.defineLocale = function (name, values) {
        if (values !== null) {
            values.abbr = name;
            if (!locales[name]) {
                locales[name] = new Locale();
            }
            locales[name].set(values);

            // backwards compat for now: also set the locale
            moment.locale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    };

    moment.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        function (key) {
            return moment.localeData(key);
        }
    );

    // returns locale data
    moment.localeData = function (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return moment._locale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null && hasOwnProp(obj, '_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    moment.isDate = isDate;

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d - ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                if ('function' === typeof Date.prototype.toISOString) {
                    // native implementation is ~50x faster, use it when we can
                    return this.toDate().toISOString();
                } else {
                    return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
                }
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {
            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function (keepLocalTime) {
            return this.utcOffset(0, keepLocalTime);
        },

        local : function (keepLocalTime) {
            if (this._isUTC) {
                this.utcOffset(0, keepLocalTime);
                this._isUTC = false;

                if (keepLocalTime) {
                    this.subtract(this._dateUtcOffset(), 'm');
                }
            }
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.localeData().postformat(output);
        },

        add : createAdder(1, 'add'),

        subtract : createAdder(-1, 'subtract'),

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (that.utcOffset() - this.utcOffset()) * 6e4,
                anchor, diff, output, daysAdjust;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month' || units === 'quarter') {
                output = monthDiff(this, that);
                if (units === 'quarter') {
                    output = output / 3;
                } else if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = this - that;
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function (time) {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're locat/utc/offset
            // or not.
            var now = time || moment(),
                sod = makeAs(now, this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.localeData().calendar(format, this, moment(now)));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.utcOffset() > this.clone().month(0).utcOffset() ||
                this.utcOffset() > this.clone().month(5).utcOffset());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.localeData());
                return this.add(input - day, 'd');
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf : function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            if (units === undefined || units === 'millisecond') {
                return this;
            }
            return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
        },

        isAfter: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this > +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return inputMs < +this.clone().startOf(units);
            }
        },

        isBefore: function (input, units) {
            var inputMs;
            units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this < +input;
            } else {
                inputMs = moment.isMoment(input) ? +input : +moment(input);
                return +this.clone().endOf(units) < inputMs;
            }
        },

        isBetween: function (from, to, units) {
            return this.isAfter(from, units) && this.isBefore(to, units);
        },

        isSame: function (input, units) {
            var inputMs;
            units = normalizeUnits(units || 'millisecond');
            if (units === 'millisecond') {
                input = moment.isMoment(input) ? input : moment(input);
                return +this === +input;
            } else {
                inputMs = +moment(input);
                return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
            }
        },

        min: deprecate(
                 'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
                 function (other) {
                     other = moment.apply(null, arguments);
                     return other < this ? this : other;
                 }
         ),

        max: deprecate(
                'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
                function (other) {
                    other = moment.apply(null, arguments);
                    return other > this ? this : other;
                }
        ),

        zone : deprecate(
                'moment().zone is deprecated, use moment().utcOffset instead. ' +
                'https://github.com/moment/moment/issues/1779',
                function (input, keepLocalTime) {
                    if (input != null) {
                        if (typeof input !== 'string') {
                            input = -input;
                        }

                        this.utcOffset(input, keepLocalTime);

                        return this;
                    } else {
                        return -this.utcOffset();
                    }
                }
        ),

        // keepLocalTime = true means only change the timezone, without
        // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
        // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
        // +0200, so we adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        utcOffset : function (input, keepLocalTime) {
            var offset = this._offset || 0,
                localAdjust;
            if (input != null) {
                if (typeof input === 'string') {
                    input = utcOffsetFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                if (!this._isUTC && keepLocalTime) {
                    localAdjust = this._dateUtcOffset();
                }
                this._offset = input;
                this._isUTC = true;
                if (localAdjust != null) {
                    this.add(localAdjust, 'm');
                }
                if (offset !== input) {
                    if (!keepLocalTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(input - offset, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }

                return this;
            } else {
                return this._isUTC ? offset : this._dateUtcOffset();
            }
        },

        isLocal : function () {
            return !this._isUTC;
        },

        isUtcOffset : function () {
            return this._isUTC;
        },

        isUtc : function () {
            return this._isUTC && this._offset === 0;
        },

        zoneAbbr : function () {
            return this._isUTC ? 'UTC' : '';
        },

        zoneName : function () {
            return this._isUTC ? 'Coordinated Universal Time' : '';
        },

        parseZone : function () {
            if (this._tzm) {
                this.utcOffset(this._tzm);
            } else if (typeof this._i === 'string') {
                this.utcOffset(utcOffsetFromString(this._i));
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).utcOffset();
            }

            return (this.utcOffset() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add((input - year), 'y');
        },

        week : function (input) {
            var week = this.localeData().week(this);
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add((input - week) * 7, 'd');
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
            return input == null ? weekday : this.add(input - weekday, 'd');
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this.localeData()._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            var unit;
            if (typeof units === 'object') {
                for (unit in units) {
                    this.set(unit, units[unit]);
                }
            }
            else {
                units = normalizeUnits(units);
                if (typeof this[units] === 'function') {
                    this[units](value);
                }
            }
            return this;
        },

        // If passed a locale key, it will set the locale for this
        // instance.  Otherwise, it will return the locale configuration
        // variables for this instance.
        locale : function (key) {
            var newLocaleData;

            if (key === undefined) {
                return this._locale._abbr;
            } else {
                newLocaleData = moment.localeData(key);
                if (newLocaleData != null) {
                    this._locale = newLocaleData;
                }
                return this;
            }
        },

        lang : deprecate(
            'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
            function (key) {
                if (key === undefined) {
                    return this.localeData();
                } else {
                    return this.locale(key);
                }
            }
        ),

        localeData : function () {
            return this._locale;
        },

        _dateUtcOffset : function () {
            // On Firefox.24 Date#getTimezoneOffset returns a floating point.
            // https://github.com/moment/moment/pull/1871
            return -Math.round(this._d.getTimezoneOffset() / 15) * 15;
        }

    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate('dates accessor is deprecated. Use date instead.', makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate('years accessor is deprecated. Use year instead.', makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    // alias isUtc for dev-friendliness
    moment.fn.isUTC = moment.fn.isUtc;

    /************************************
        Duration Prototype
    ************************************/


    function daysToYears (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        return days * 400 / 146097;
    }

    function yearsToDays (years) {
        // years * 365 + absRound(years / 4) -
        //     absRound(years / 100) + absRound(years / 400);
        return years * 146097 / 400;
    }

    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years = 0;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);

            // Accurately convert days to years, assume start from year 0.
            years = absRound(daysToYears(days));
            days -= absRound(yearsToDays(years));

            // 30 days to a month
            // TODO (iskren): Use anchor date (like 1st Jan) to compute this.
            months += absRound(days / 30);
            days %= 30;

            // 12 months -> 1 year
            years += absRound(months / 12);
            months %= 12;

            data.days = days;
            data.months = months;
            data.years = years;
        },

        abs : function () {
            this._milliseconds = Math.abs(this._milliseconds);
            this._days = Math.abs(this._days);
            this._months = Math.abs(this._months);

            this._data.milliseconds = Math.abs(this._data.milliseconds);
            this._data.seconds = Math.abs(this._data.seconds);
            this._data.minutes = Math.abs(this._data.minutes);
            this._data.hours = Math.abs(this._data.hours);
            this._data.months = Math.abs(this._data.months);
            this._data.years = Math.abs(this._data.years);

            return this;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var output = relativeTime(this, !withSuffix, this.localeData());

            if (withSuffix) {
                output = this.localeData().pastFuture(+this, output);
            }

            return this.localeData().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            var days, months;
            units = normalizeUnits(units);

            if (units === 'month' || units === 'year') {
                days = this._days + this._milliseconds / 864e5;
                months = this._months + daysToYears(days) * 12;
                return units === 'month' ? months : months / 12;
            } else {
                // handle milliseconds separately because of floating point math errors (issue #1867)
                days = this._days + Math.round(yearsToDays(this._months / 12));
                switch (units) {
                    case 'week': return days / 7 + this._milliseconds / 6048e5;
                    case 'day': return days + this._milliseconds / 864e5;
                    case 'hour': return days * 24 + this._milliseconds / 36e5;
                    case 'minute': return days * 24 * 60 + this._milliseconds / 6e4;
                    case 'second': return days * 24 * 60 * 60 + this._milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                    case 'millisecond': return Math.floor(days * 24 * 60 * 60 * 1000) + this._milliseconds;
                    default: throw new Error('Unknown unit ' + units);
                }
            }
        },

        lang : moment.fn.lang,
        locale : moment.fn.locale,

        toIsoString : deprecate(
            'toIsoString() is deprecated. Please use toISOString() instead ' +
            '(notice the capitals)',
            function () {
                return this.toISOString();
            }
        ),

        toISOString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        },

        localeData : function () {
            return this._locale;
        },

        toJSON : function () {
            return this.toISOString();
        }
    });

    moment.duration.fn.toString = moment.duration.fn.toISOString;

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    for (i in unitMillisecondFactors) {
        if (hasOwnProp(unitMillisecondFactors, i)) {
            makeDurationGetter(i.toLowerCase());
        }
    }

    moment.duration.fn.asMilliseconds = function () {
        return this.as('ms');
    };
    moment.duration.fn.asSeconds = function () {
        return this.as('s');
    };
    moment.duration.fn.asMinutes = function () {
        return this.as('m');
    };
    moment.duration.fn.asHours = function () {
        return this.as('h');
    };
    moment.duration.fn.asDays = function () {
        return this.as('d');
    };
    moment.duration.fn.asWeeks = function () {
        return this.as('weeks');
    };
    moment.duration.fn.asMonths = function () {
        return this.as('M');
    };
    moment.duration.fn.asYears = function () {
        return this.as('y');
    };

    /************************************
        Default Locale
    ************************************/


    // Set default locale, other locale will inherit from English.
    moment.locale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LOCALES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    'Accessing Moment through the global scope is ' +
                    'deprecated, and will be removed in an upcoming ' +
                    'release.',
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === 'function' && define.amd) {
        define('moment', ['require', 'exports', 'module'], function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);
/*! JSON v3.3.2 | http://bestiejs.github.io/json3 | Copyright 2012-2014, Kit Cambridge | http://kit.mit-license.org */
;(function () {
  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // A set of types used to distinguish objects from primitives.
  var objectTypes = {
    "function": true,
    "object": true
  };

  // Detect the `exports` object exposed by CommonJS implementations.
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;

  // Use the `global` object exposed by Node (including Browserify via
  // `insert-module-globals`), Narwhal, and Ringo as the default context,
  // and the `window` object in browsers. Rhino exports a `global` function
  // instead.
  var root = objectTypes[typeof window] && window || this,
      freeGlobal = freeExports && objectTypes[typeof module] && module && !module.nodeType && typeof global == "object" && global;

  if (freeGlobal && (freeGlobal["global"] === freeGlobal || freeGlobal["window"] === freeGlobal || freeGlobal["self"] === freeGlobal)) {
    root = freeGlobal;
  }

  // Public: Initializes JSON 3 using the given `context` object, attaching the
  // `stringify` and `parse` functions to the specified `exports` object.
  function runInContext(context, exports) {
    context || (context = root["Object"]());
    exports || (exports = root["Object"]());

    // Native constructor aliases.
    var Number = context["Number"] || root["Number"],
        String = context["String"] || root["String"],
        Object = context["Object"] || root["Object"],
        Date = context["Date"] || root["Date"],
        SyntaxError = context["SyntaxError"] || root["SyntaxError"],
        TypeError = context["TypeError"] || root["TypeError"],
        Math = context["Math"] || root["Math"],
        nativeJSON = context["JSON"] || root["JSON"];

    // Delegate to the native `stringify` and `parse` implementations.
    if (typeof nativeJSON == "object" && nativeJSON) {
      exports.stringify = nativeJSON.stringify;
      exports.parse = nativeJSON.parse;
    }

    // Convenience aliases.
    var objectProto = Object.prototype,
        getClass = objectProto.toString,
        isProperty, forEach, undef;

    // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
    var isExtended = new Date(-3509827334573292);
    try {
      // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
      // results for certain dates in Opera >= 10.53.
      isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
        // Safari < 2.0.2 stores the internal millisecond time value correctly,
        // but clips the values returned by the date methods to the range of
        // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
        isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
    } catch (exception) {}

    // Internal: Determines whether the native `JSON.stringify` and `parse`
    // implementations are spec-compliant. Based on work by Ken Snyder.
    function has(name) {
      if (has[name] !== undef) {
        // Return cached feature test result.
        return has[name];
      }
      var isSupported;
      if (name == "bug-string-char-index") {
        // IE <= 7 doesn't support accessing string characters using square
        // bracket notation. IE 8 only supports this for primitives.
        isSupported = "a"[0] != "a";
      } else if (name == "json") {
        // Indicates whether both `JSON.stringify` and `JSON.parse` are
        // supported.
        isSupported = has("json-stringify") && has("json-parse");
      } else {
        var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
        // Test `JSON.stringify`.
        if (name == "json-stringify") {
          var stringify = exports.stringify, stringifySupported = typeof stringify == "function" && isExtended;
          if (stringifySupported) {
            // A test function object with a custom `toJSON` method.
            (value = function () {
              return 1;
            }).toJSON = value;
            try {
              stringifySupported =
                // Firefox 3.1b1 and b2 serialize string, number, and boolean
                // primitives as object literals.
                stringify(0) === "0" &&
                // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
                // literals.
                stringify(new Number()) === "0" &&
                stringify(new String()) == '""' &&
                // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
                // does not define a canonical JSON representation (this applies to
                // objects with `toJSON` properties as well, *unless* they are nested
                // within an object or array).
                stringify(getClass) === undef &&
                // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
                // FF 3.1b3 pass this test.
                stringify(undef) === undef &&
                // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
                // respectively, if the value is omitted entirely.
                stringify() === undef &&
                // FF 3.1b1, 2 throw an error if the given value is not a number,
                // string, array, object, Boolean, or `null` literal. This applies to
                // objects with custom `toJSON` methods as well, unless they are nested
                // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
                // methods entirely.
                stringify(value) === "1" &&
                stringify([value]) == "[1]" &&
                // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
                // `"[null]"`.
                stringify([undef]) == "[null]" &&
                // YUI 3.0.0b1 fails to serialize `null` literals.
                stringify(null) == "null" &&
                // FF 3.1b1, 2 halts serialization if an array contains a function:
                // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
                // elides non-JSON values from objects and arrays, unless they
                // define custom `toJSON` methods.
                stringify([undef, getClass, null]) == "[null,null,null]" &&
                // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
                // where character escape codes are expected (e.g., `\b` => `\u0008`).
                stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
                // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
                stringify(null, value) === "1" &&
                stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
                // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
                // serialize extended years.
                stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
                // The milliseconds are optional in ES 5, but required in 5.1.
                stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
                // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
                // four-digit years instead of six-digit years. Credits: @Yaffle.
                stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
                // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
                // values less than 1000. Credits: @Yaffle.
                stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
            } catch (exception) {
              stringifySupported = false;
            }
          }
          isSupported = stringifySupported;
        }
        // Test `JSON.parse`.
        if (name == "json-parse") {
          var parse = exports.parse;
          if (typeof parse == "function") {
            try {
              // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
              // Conforming implementations should also coerce the initial argument to
              // a string prior to parsing.
              if (parse("0") === 0 && !parse(false)) {
                // Simple parsing test.
                value = parse(serialized);
                var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
                if (parseSupported) {
                  try {
                    // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                    parseSupported = !parse('"\t"');
                  } catch (exception) {}
                  if (parseSupported) {
                    try {
                      // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                      // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                      // certain octal literals.
                      parseSupported = parse("01") !== 1;
                    } catch (exception) {}
                  }
                  if (parseSupported) {
                    try {
                      // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                      // points. These environments, along with FF 3.1b1 and 2,
                      // also allow trailing commas in JSON objects and arrays.
                      parseSupported = parse("1.") !== 1;
                    } catch (exception) {}
                  }
                }
              }
            } catch (exception) {
              parseSupported = false;
            }
          }
          isSupported = parseSupported;
        }
      }
      return has[name] = !!isSupported;
    }

    if (!has("json")) {
      // Common `[[Class]]` name aliases.
      var functionClass = "[object Function]",
          dateClass = "[object Date]",
          numberClass = "[object Number]",
          stringClass = "[object String]",
          arrayClass = "[object Array]",
          booleanClass = "[object Boolean]";

      // Detect incomplete support for accessing string characters by index.
      var charIndexBuggy = has("bug-string-char-index");

      // Define additional utility methods if the `Date` methods are buggy.
      if (!isExtended) {
        var floor = Math.floor;
        // A mapping between the months of the year and the number of days between
        // January 1st and the first of the respective month.
        var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
        // Internal: Calculates the number of days between the Unix epoch and the
        // first day of the given month.
        var getDay = function (year, month) {
          return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
        };
      }

      // Internal: Determines if a property is a direct property of the given
      // object. Delegates to the native `Object#hasOwnProperty` method.
      if (!(isProperty = objectProto.hasOwnProperty)) {
        isProperty = function (property) {
          var members = {}, constructor;
          if ((members.__proto__ = null, members.__proto__ = {
            // The *proto* property cannot be set multiple times in recent
            // versions of Firefox and SeaMonkey.
            "toString": 1
          }, members).toString != getClass) {
            // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
            // supports the mutable *proto* property.
            isProperty = function (property) {
              // Capture and break the object's prototype chain (see section 8.6.2
              // of the ES 5.1 spec). The parenthesized expression prevents an
              // unsafe transformation by the Closure Compiler.
              var original = this.__proto__, result = property in (this.__proto__ = null, this);
              // Restore the original prototype chain.
              this.__proto__ = original;
              return result;
            };
          } else {
            // Capture a reference to the top-level `Object` constructor.
            constructor = members.constructor;
            // Use the `constructor` property to simulate `Object#hasOwnProperty` in
            // other environments.
            isProperty = function (property) {
              var parent = (this.constructor || constructor).prototype;
              return property in this && !(property in parent && this[property] === parent[property]);
            };
          }
          members = null;
          return isProperty.call(this, property);
        };
      }

      // Internal: Normalizes the `for...in` iteration algorithm across
      // environments. Each enumerated key is yielded to a `callback` function.
      forEach = function (object, callback) {
        var size = 0, Properties, members, property;

        // Tests for bugs in the current environment's `for...in` algorithm. The
        // `valueOf` property inherits the non-enumerable flag from
        // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
        (Properties = function () {
          this.valueOf = 0;
        }).prototype.valueOf = 0;

        // Iterate over a new instance of the `Properties` class.
        members = new Properties();
        for (property in members) {
          // Ignore all properties inherited from `Object.prototype`.
          if (isProperty.call(members, property)) {
            size++;
          }
        }
        Properties = members = null;

        // Normalize the iteration algorithm.
        if (!size) {
          // A list of non-enumerable properties inherited from `Object.prototype`.
          members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
          // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
          // properties.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, length;
            var hasProperty = !isFunction && typeof object.constructor != "function" && objectTypes[typeof object.hasOwnProperty] && object.hasOwnProperty || isProperty;
            for (property in object) {
              // Gecko <= 1.0 enumerates the `prototype` property of functions under
              // certain conditions; IE does not.
              if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
                callback(property);
              }
            }
            // Manually invoke the callback for each non-enumerable property.
            for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
          };
        } else if (size == 2) {
          // Safari <= 2.0.4 enumerates shadowed properties twice.
          forEach = function (object, callback) {
            // Create a set of iterated properties.
            var members = {}, isFunction = getClass.call(object) == functionClass, property;
            for (property in object) {
              // Store each property name to prevent double enumeration. The
              // `prototype` property of functions is not enumerated due to cross-
              // environment inconsistencies.
              if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
                callback(property);
              }
            }
          };
        } else {
          // No bugs detected; use the standard `for...in` algorithm.
          forEach = function (object, callback) {
            var isFunction = getClass.call(object) == functionClass, property, isConstructor;
            for (property in object) {
              if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
                callback(property);
              }
            }
            // Manually invoke the callback for the `constructor` property due to
            // cross-environment inconsistencies.
            if (isConstructor || isProperty.call(object, (property = "constructor"))) {
              callback(property);
            }
          };
        }
        return forEach(object, callback);
      };

      // Public: Serializes a JavaScript `value` as a JSON string. The optional
      // `filter` argument may specify either a function that alters how object and
      // array members are serialized, or an array of strings and numbers that
      // indicates which properties should be serialized. The optional `width`
      // argument may be either a string or number that specifies the indentation
      // level of the output.
      if (!has("json-stringify")) {
        // Internal: A map of control characters and their escaped equivalents.
        var Escapes = {
          92: "\\\\",
          34: '\\"',
          8: "\\b",
          12: "\\f",
          10: "\\n",
          13: "\\r",
          9: "\\t"
        };

        // Internal: Converts `value` into a zero-padded string such that its
        // length is at least equal to `width`. The `width` must be <= 6.
        var leadingZeroes = "000000";
        var toPaddedString = function (width, value) {
          // The `|| 0` expression is necessary to work around a bug in
          // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
          return (leadingZeroes + (value || 0)).slice(-width);
        };

        // Internal: Double-quotes a string `value`, replacing all ASCII control
        // characters (characters with code unit values between 0 and 31) with
        // their escaped equivalents. This is an implementation of the
        // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
        var unicodePrefix = "\\u00";
        var quote = function (value) {
          var result = '"', index = 0, length = value.length, useCharIndex = !charIndexBuggy || length > 10;
          var symbols = useCharIndex && (charIndexBuggy ? value.split("") : value);
          for (; index < length; index++) {
            var charCode = value.charCodeAt(index);
            // If the character is a control character, append its Unicode or
            // shorthand escape sequence; otherwise, append the character as-is.
            switch (charCode) {
              case 8: case 9: case 10: case 12: case 13: case 34: case 92:
                result += Escapes[charCode];
                break;
              default:
                if (charCode < 32) {
                  result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                  break;
                }
                result += useCharIndex ? symbols[index] : value.charAt(index);
            }
          }
          return result + '"';
        };

        // Internal: Recursively serializes an object. Implements the
        // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
        var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
          var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
          try {
            // Necessary for host object support.
            value = object[property];
          } catch (exception) {}
          if (typeof value == "object" && value) {
            className = getClass.call(value);
            if (className == dateClass && !isProperty.call(value, "toJSON")) {
              if (value > -1 / 0 && value < 1 / 0) {
                // Dates are serialized according to the `Date#toJSON` method
                // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
                // for the ISO 8601 date time string format.
                if (getDay) {
                  // Manually compute the year, month, date, hours, minutes,
                  // seconds, and milliseconds if the `getUTC*` methods are
                  // buggy. Adapted from @Yaffle's `date-shim` project.
                  date = floor(value / 864e5);
                  for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                  for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                  date = 1 + date - getDay(year, month);
                  // The `time` value specifies the time within the day (see ES
                  // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                  // to compute `A modulo B`, as the `%` operator does not
                  // correspond to the `modulo` operation for negative numbers.
                  time = (value % 864e5 + 864e5) % 864e5;
                  // The hours, minutes, seconds, and milliseconds are obtained by
                  // decomposing the time within the day. See section 15.9.1.10.
                  hours = floor(time / 36e5) % 24;
                  minutes = floor(time / 6e4) % 60;
                  seconds = floor(time / 1e3) % 60;
                  milliseconds = time % 1e3;
                } else {
                  year = value.getUTCFullYear();
                  month = value.getUTCMonth();
                  date = value.getUTCDate();
                  hours = value.getUTCHours();
                  minutes = value.getUTCMinutes();
                  seconds = value.getUTCSeconds();
                  milliseconds = value.getUTCMilliseconds();
                }
                // Serialize extended years correctly.
                value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                  "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                  // Months, dates, hours, minutes, and seconds should have two
                  // digits; milliseconds should have three.
                  "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                  // Milliseconds are optional in ES 5.0, but required in 5.1.
                  "." + toPaddedString(3, milliseconds) + "Z";
              } else {
                value = null;
              }
            } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
              // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
              // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
              // ignores all `toJSON` methods on these objects unless they are
              // defined directly on an instance.
              value = value.toJSON(property);
            }
          }
          if (callback) {
            // If a replacement function was provided, call it to obtain the value
            // for serialization.
            value = callback.call(object, property, value);
          }
          if (value === null) {
            return "null";
          }
          className = getClass.call(value);
          if (className == booleanClass) {
            // Booleans are represented literally.
            return "" + value;
          } else if (className == numberClass) {
            // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
            // `"null"`.
            return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
          } else if (className == stringClass) {
            // Strings are double-quoted and escaped.
            return quote("" + value);
          }
          // Recursively serialize objects and arrays.
          if (typeof value == "object") {
            // Check for cyclic structures. This is a linear search; performance
            // is inversely proportional to the number of unique nested objects.
            for (length = stack.length; length--;) {
              if (stack[length] === value) {
                // Cyclic structures cannot be serialized by `JSON.stringify`.
                throw TypeError();
              }
            }
            // Add the object to the stack of traversed objects.
            stack.push(value);
            results = [];
            // Save the current indentation level and indent one additional level.
            prefix = indentation;
            indentation += whitespace;
            if (className == arrayClass) {
              // Recursively serialize array elements.
              for (index = 0, length = value.length; index < length; index++) {
                element = serialize(index, value, callback, properties, whitespace, indentation, stack);
                results.push(element === undef ? "null" : element);
              }
              result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
            } else {
              // Recursively serialize object members. Members are selected from
              // either a user-specified list of property names, or the object
              // itself.
              forEach(properties || value, function (property) {
                var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
                if (element !== undef) {
                  // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                  // is not the empty string, let `member` {quote(property) + ":"}
                  // be the concatenation of `member` and the `space` character."
                  // The "`space` character" refers to the literal space
                  // character, not the `space` {width} argument provided to
                  // `JSON.stringify`.
                  results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
                }
              });
              result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
            }
            // Remove the object from the traversed object stack.
            stack.pop();
            return result;
          }
        };

        // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
        exports.stringify = function (source, filter, width) {
          var whitespace, callback, properties, className;
          if (objectTypes[typeof filter] && filter) {
            if ((className = getClass.call(filter)) == functionClass) {
              callback = filter;
            } else if (className == arrayClass) {
              // Convert the property names array into a makeshift set.
              properties = {};
              for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
            }
          }
          if (width) {
            if ((className = getClass.call(width)) == numberClass) {
              // Convert the `width` to an integer and create a string containing
              // `width` number of space characters.
              if ((width -= width % 1) > 0) {
                for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
              }
            } else if (className == stringClass) {
              whitespace = width.length <= 10 ? width : width.slice(0, 10);
            }
          }
          // Opera <= 7.54u2 discards the values associated with empty string keys
          // (`""`) only if they are used directly within an object member list
          // (e.g., `!("" in { "": 1})`).
          return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
        };
      }

      // Public: Parses a JSON source string.
      if (!has("json-parse")) {
        var fromCharCode = String.fromCharCode;

        // Internal: A map of escaped control characters and their unescaped
        // equivalents.
        var Unescapes = {
          92: "\\",
          34: '"',
          47: "/",
          98: "\b",
          116: "\t",
          110: "\n",
          102: "\f",
          114: "\r"
        };

        // Internal: Stores the parser state.
        var Index, Source;

        // Internal: Resets the parser state and throws a `SyntaxError`.
        var abort = function () {
          Index = Source = null;
          throw SyntaxError();
        };

        // Internal: Returns the next token, or `"$"` if the parser has reached
        // the end of the source string. A token may be a string, number, `null`
        // literal, or Boolean literal.
        var lex = function () {
          var source = Source, length = source.length, value, begin, position, isSigned, charCode;
          while (Index < length) {
            charCode = source.charCodeAt(Index);
            switch (charCode) {
              case 9: case 10: case 13: case 32:
                // Skip whitespace tokens, including tabs, carriage returns, line
                // feeds, and space characters.
                Index++;
                break;
              case 123: case 125: case 91: case 93: case 58: case 44:
                // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
                // the current position.
                value = charIndexBuggy ? source.charAt(Index) : source[Index];
                Index++;
                return value;
              case 34:
                // `"` delimits a JSON string; advance to the next character and
                // begin parsing the string. String tokens are prefixed with the
                // sentinel `@` character to distinguish them from punctuators and
                // end-of-string tokens.
                for (value = "@", Index++; Index < length;) {
                  charCode = source.charCodeAt(Index);
                  if (charCode < 32) {
                    // Unescaped ASCII control characters (those with a code unit
                    // less than the space character) are not permitted.
                    abort();
                  } else if (charCode == 92) {
                    // A reverse solidus (`\`) marks the beginning of an escaped
                    // control character (including `"`, `\`, and `/`) or Unicode
                    // escape sequence.
                    charCode = source.charCodeAt(++Index);
                    switch (charCode) {
                      case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                        // Revive escaped control characters.
                        value += Unescapes[charCode];
                        Index++;
                        break;
                      case 117:
                        // `\u` marks the beginning of a Unicode escape sequence.
                        // Advance to the first character and validate the
                        // four-digit code point.
                        begin = ++Index;
                        for (position = Index + 4; Index < position; Index++) {
                          charCode = source.charCodeAt(Index);
                          // A valid sequence comprises four hexdigits (case-
                          // insensitive) that form a single hexadecimal value.
                          if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                            // Invalid Unicode escape sequence.
                            abort();
                          }
                        }
                        // Revive the escaped character.
                        value += fromCharCode("0x" + source.slice(begin, Index));
                        break;
                      default:
                        // Invalid escape sequence.
                        abort();
                    }
                  } else {
                    if (charCode == 34) {
                      // An unescaped double-quote character marks the end of the
                      // string.
                      break;
                    }
                    charCode = source.charCodeAt(Index);
                    begin = Index;
                    // Optimize for the common case where a string is valid.
                    while (charCode >= 32 && charCode != 92 && charCode != 34) {
                      charCode = source.charCodeAt(++Index);
                    }
                    // Append the string as-is.
                    value += source.slice(begin, Index);
                  }
                }
                if (source.charCodeAt(Index) == 34) {
                  // Advance to the next character and return the revived string.
                  Index++;
                  return value;
                }
                // Unterminated string.
                abort();
              default:
                // Parse numbers and literals.
                begin = Index;
                // Advance past the negative sign, if one is specified.
                if (charCode == 45) {
                  isSigned = true;
                  charCode = source.charCodeAt(++Index);
                }
                // Parse an integer or floating-point value.
                if (charCode >= 48 && charCode <= 57) {
                  // Leading zeroes are interpreted as octal literals.
                  if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                    // Illegal octal literal.
                    abort();
                  }
                  isSigned = false;
                  // Parse the integer component.
                  for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                  // Floats cannot contain a leading decimal point; however, this
                  // case is already accounted for by the parser.
                  if (source.charCodeAt(Index) == 46) {
                    position = ++Index;
                    // Parse the decimal component.
                    for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal trailing decimal.
                      abort();
                    }
                    Index = position;
                  }
                  // Parse exponents. The `e` denoting the exponent is
                  // case-insensitive.
                  charCode = source.charCodeAt(Index);
                  if (charCode == 101 || charCode == 69) {
                    charCode = source.charCodeAt(++Index);
                    // Skip past the sign following the exponent, if one is
                    // specified.
                    if (charCode == 43 || charCode == 45) {
                      Index++;
                    }
                    // Parse the exponential component.
                    for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                    if (position == Index) {
                      // Illegal empty exponent.
                      abort();
                    }
                    Index = position;
                  }
                  // Coerce the parsed value to a JavaScript number.
                  return +source.slice(begin, Index);
                }
                // A negative sign may only precede numbers.
                if (isSigned) {
                  abort();
                }
                // `true`, `false`, and `null` literals.
                if (source.slice(Index, Index + 4) == "true") {
                  Index += 4;
                  return true;
                } else if (source.slice(Index, Index + 5) == "false") {
                  Index += 5;
                  return false;
                } else if (source.slice(Index, Index + 4) == "null") {
                  Index += 4;
                  return null;
                }
                // Unrecognized token.
                abort();
            }
          }
          // Return the sentinel `$` character if the parser has reached the end
          // of the source string.
          return "$";
        };

        // Internal: Parses a JSON `value` token.
        var get = function (value) {
          var results, hasMembers;
          if (value == "$") {
            // Unexpected end of input.
            abort();
          }
          if (typeof value == "string") {
            if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
              // Remove the sentinel `@` character.
              return value.slice(1);
            }
            // Parse object and array literals.
            if (value == "[") {
              // Parses a JSON array, returning a new JavaScript array.
              results = [];
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing square bracket marks the end of the array literal.
                if (value == "]") {
                  break;
                }
                // If the array literal contains elements, the current token
                // should be a comma separating the previous element from the
                // next.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "]") {
                      // Unexpected trailing `,` in array literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each array element.
                    abort();
                  }
                }
                // Elisions and leading commas are not permitted.
                if (value == ",") {
                  abort();
                }
                results.push(get(value));
              }
              return results;
            } else if (value == "{") {
              // Parses a JSON object, returning a new JavaScript object.
              results = {};
              for (;; hasMembers || (hasMembers = true)) {
                value = lex();
                // A closing curly brace marks the end of the object literal.
                if (value == "}") {
                  break;
                }
                // If the object literal contains members, the current token
                // should be a comma separator.
                if (hasMembers) {
                  if (value == ",") {
                    value = lex();
                    if (value == "}") {
                      // Unexpected trailing `,` in object literal.
                      abort();
                    }
                  } else {
                    // A `,` must separate each object member.
                    abort();
                  }
                }
                // Leading commas are not permitted, object property names must be
                // double-quoted strings, and a `:` must separate each property
                // name and value.
                if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                  abort();
                }
                results[value.slice(1)] = get(lex());
              }
              return results;
            }
            // Unexpected token encountered.
            abort();
          }
          return value;
        };

        // Internal: Updates a traversed object member.
        var update = function (source, property, callback) {
          var element = walk(source, property, callback);
          if (element === undef) {
            delete source[property];
          } else {
            source[property] = element;
          }
        };

        // Internal: Recursively traverses a parsed JSON object, invoking the
        // `callback` function for each value. This is an implementation of the
        // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
        var walk = function (source, property, callback) {
          var value = source[property], length;
          if (typeof value == "object" && value) {
            // `forEach` can't be used to traverse an array in Opera <= 8.54
            // because its `Object#hasOwnProperty` implementation returns `false`
            // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
            if (getClass.call(value) == arrayClass) {
              for (length = value.length; length--;) {
                update(value, length, callback);
              }
            } else {
              forEach(value, function (property) {
                update(value, property, callback);
              });
            }
          }
          return callback.call(source, property, value);
        };

        // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
        exports.parse = function (source, callback) {
          var result, value;
          Index = 0;
          Source = "" + source;
          result = get(lex());
          // If a JSON string contains multiple tokens, it is invalid.
          if (lex() != "$") {
            abort();
          }
          // Reset the parser state.
          Index = Source = null;
          return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
        };
      }
    }

    exports["runInContext"] = runInContext;
    return exports;
  }

  if (freeExports && !isLoader) {
    // Export for CommonJS environments.
    runInContext(root, freeExports);
  } else {
    // Export for web browsers and JavaScript engines.
    var nativeJSON = root.JSON,
        previousJSON = root["JSON3"],
        isRestored = false;

    var JSON3 = runInContext(root, (root["JSON3"] = {
      // Public: Restores the original value of the global `JSON` object and
      // returns a reference to the `JSON3` object.
      "noConflict": function () {
        if (!isRestored) {
          isRestored = true;
          root.JSON = nativeJSON;
          root["JSON3"] = previousJSON;
          nativeJSON = previousJSON = null;
        }
        return JSON3;
      }
    }));

    root.JSON = {
      "parse": JSON3.parse,
      "stringify": JSON3.stringify
    };
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
      define('json3', [], function () {
          return JSON3;
    });
  }
}).call(this);
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var setImmediate;

    function addFromSetImmediateArguments(args) {
        tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
        return nextHandle++;
    }

    // This function accepts the same arguments as setImmediate, but
    // returns a function that requires no arguments.
    function partiallyApplied(handler) {
        var args = [].slice.call(arguments, 1);
        return function() {
            if (typeof handler === "function") {
                handler.apply(undefined, args);
            } else {
                (new Function("" + handler))();
            }
        };
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    task();
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function installNextTickImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            process.nextTick(partiallyApplied(runIfPresent, handle));
            return handle;
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            global.postMessage(messagePrefix + handle, "*");
            return handle;
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            channel.port2.postMessage(handle);
            return handle;
        };
    }

    function installSetTimeoutImplementation() {
        setImmediate = function() {
            var handle = addFromSetImmediateArguments(arguments);
            setTimeout(partiallyApplied(runIfPresent, handle), 0);
            return handle;
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(new Function("return this")()));
(function(global) {
	if(typeof module !== 'undefined' && module.exports) {
		module.exports = global.Promise ? global.Promise : Promise;
	} else if (!global.Promise) {
		global.Promise = Promise;
	}

	// Use polyfill for setImmediate for performance gains
	var asap = global.setImmediate || function(fn) { setTimeout(fn, 1); };

	// Polyfill for Function.prototype.bind
	function bind(fn, thisArg) {
		return function() {
			fn.apply(thisArg, arguments);
		}
	}

	var isArray = Array.isArray || function(value) { return Object.prototype.toString.call(value) === "[object Array]" };

	function Promise(fn) {
		if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
		if (typeof fn !== 'function') throw new TypeError('not a function');
		this._state = null;
		this._value = null;
		this._deferreds = []

		doResolve(fn, bind(resolve, this), bind(reject, this))
	}

	function handle(deferred) {
		var me = this;
		if (this._state === null) {
			this._deferreds.push(deferred);
			return
		}
		asap(function() {
			var cb = me._state ? deferred.onFulfilled : deferred.onRejected
			if (cb === null) {
				(me._state ? deferred.resolve : deferred.reject)(me._value);
				return;
			}
			var ret;
			try {
				ret = cb(me._value);
			}
			catch (e) {
				deferred.reject(e);
				return;
			}
			deferred.resolve(ret);
		})
	}

	function resolve(newValue) {
		try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
			if (newValue === this) throw new TypeError('A promise cannot be resolved with itself.');
			if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
				var then = newValue.then;
				if (typeof then === 'function') {
					doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
					return;
				}
			}
			this._state = true;
			this._value = newValue;
			finale.call(this);
		} catch (e) { reject.call(this, e); }
	}

	function reject(newValue) {
		this._state = false;
		this._value = newValue;
		finale.call(this);
	}

	function finale() {
		for (var i = 0, len = this._deferreds.length; i < len; i++) {
			handle.call(this, this._deferreds[i]);
		}
		this._deferreds = null;
	}

	function Handler(onFulfilled, onRejected, resolve, reject){
		this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
		this.onRejected = typeof onRejected === 'function' ? onRejected : null;
		this.resolve = resolve;
		this.reject = reject;
	}

	/**
	 * Take a potentially misbehaving resolver function and make sure
	 * onFulfilled and onRejected are only called once.
	 *
	 * Makes no guarantees about asynchrony.
	 */
	function doResolve(fn, onFulfilled, onRejected) {
		var done = false;
		try {
			fn(function (value) {
				if (done) return;
				done = true;
				onFulfilled(value);
			}, function (reason) {
				if (done) return;
				done = true;
				onRejected(reason);
			})
		} catch (ex) {
			if (done) return;
			done = true;
			onRejected(ex);
		}
	}

	Promise.prototype['catch'] = function (onRejected) {
		return this.then(null, onRejected);
	};

	Promise.prototype.then = function(onFulfilled, onRejected) {
		var me = this;
		return new Promise(function(resolve, reject) {
			handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
		})
	};

	Promise.all = function () {
		var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

		return new Promise(function (resolve, reject) {
			if (args.length === 0) return resolve([]);
			var remaining = args.length;
			function res(i, val) {
				try {
					if (val && (typeof val === 'object' || typeof val === 'function')) {
						var then = val.then;
						if (typeof then === 'function') {
							then.call(val, function (val) { res(i, val) }, reject);
							return;
						}
					}
					args[i] = val;
					if (--remaining === 0) {
						resolve(args);
					}
				} catch (ex) {
					reject(ex);
				}
			}
			for (var i = 0; i < args.length; i++) {
				res(i, args[i]);
			}
		});
	};

	Promise.resolve = function (value) {
		if (value && typeof value === 'object' && value.constructor === Promise) {
			return value;
		}

		return new Promise(function (resolve) {
			resolve(value);
		});
	};

	Promise.reject = function (value) {
		return new Promise(function (resolve, reject) {
			reject(value);
		});
	};

	Promise.race = function (values) {
		return new Promise(function (resolve, reject) {
			for(var i = 0, len = values.length; i < len; i++) {
				values[i].then(resolve, reject);
			}
		});
	};
})(this);// UAParser.js v0.7.1
// Lightweight JavaScript-based User-Agent string parser
// https://github.com/faisalman/ua-parser-js
//
// Copyright © 2012-2014 Faisal Salman <fyzlman@gmail.com>
// Dual licensed under GPLv2 & MIT

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.1',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        MAJOR       = 'major',
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            for (var i in extensions) {
                if ("browser cpu device engine os".indexOf(i) !== -1 && extensions[i].length % 2 === 0) {
                    regexes[i] = extensions[i].concat(regexes[i]);
                }
            }
            return regexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function () {

            // loop through all regexes maps
            for (var result, i = 0, j, k, p, q, matches, match, args = arguments; i < args.length; i += 2) {

                var regex = args[i],       // even sequence (0,2,4,..)
                    props = args[i + 1];   // odd sequence (1,3,5,..)

                // construct object barebones
                if (typeof(result) === UNDEF_TYPE) {
                    result = {};
                    for (p in props) {
                        q = props[p];
                        if (typeof(q) === OBJ_TYPE) {
                            result[q[0]] = undefined;
                        } else {
                            result[q] = undefined;
                        }
                    }
                }

                // try matching uastring with regexes
                for (j = k = 0; j < regex.length; j++) {
                    matches = regex[j].exec(this.getUA());
                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof(q) === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof(q[1]) == FUNC_TYPE) {
                                        // assign modified match
                                        result[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        result[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof(q[1]) === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        result[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        result[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        result[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                result[q] = match ? match : undefined;
                            }
                        }
                        break;
                    }
                }

                if(!!matches) break; // break the loop immediately if match found
            }
            return result;
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof(map[i]) === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                major : {
                    '1' : ['/8', '/1', '/3'],
                    '2' : '/4',
                    '?' : '/'
                },
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/((\d+)?[\w\.-]+)/i,                                 // Opera Mini
            /(opera\s[mobiletab]+).+version\/((\d+)?[\w\.-]+)/i,                // Opera Mobi/Tablet
            /(opera).+version\/((\d+)?[\w\.]+)/i,                               // Opera > 9.80
            /(opera)[\/\s]+((\d+)?[\w\.]+)/i                                    // Opera < 9.80

            ], [NAME, VERSION, MAJOR], [

            /\s(opr)\/((\d+)?[\w\.]+)/i                                         // Opera Webkit
            ], [[NAME, 'Opera'], VERSION, MAJOR], [

            // Mixed
            /(kindle)\/((\d+)?[\w\.]+)/i,                                       // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?((\d+)?[\w\.]+)*/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer

            // Trident based
            /(avant\s|iemobile|slim|baidu)(?:browser)?[\/\s]?((\d+)?[\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser/Baidu
            /(?:ms|\()(ie)\s((\d+)?[\w\.]+)/i,                                  // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)((?:\/)[\w\.]+)*/i,                                        // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron)\/((\d+)?[\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron
            ], [NAME, VERSION, MAJOR], [

            /(trident).+rv[:\s]((\d+)?[\w\.]+).+like\sgecko/i                   // IE11
            ], [[NAME, 'IE'], VERSION, MAJOR], [

            /(yabrowser)\/((\d+)?[\w\.]+)/i                                     // Yandex
            ], [[NAME, 'Yandex'], VERSION, MAJOR], [

            /(comodo_dragon)\/((\d+)?[\w\.]+)/i                                 // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION, MAJOR], [ 

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?((\d+)?[\w\.]+)/i,
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            /(uc\s?browser|qqbrowser)[\/\s]?((\d+)?[\w\.]+)/i
                                                                                //UCBrowser/QQBrowser
            ], [NAME, VERSION, MAJOR], [

            /(dolfin)\/((\d+)?[\w\.]+)/i                                        // Dolphin
            ], [[NAME, 'Dolphin'], VERSION, MAJOR], [

            /((?:android.+)crmo|crios)\/((\d+)?[\w\.]+)/i                       // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION, MAJOR], [

            /version\/((\d+)?[\w\.]+).+?mobile\/\w+\s(safari)/i                 // Mobile Safari
            ], [VERSION, MAJOR, [NAME, 'Mobile Safari']], [

            /version\/((\d+)?[\w\.]+).+?(mobile\s?safari|safari)/i              // Safari & Safari Mobile
            ], [VERSION, MAJOR, NAME], [

            /webkit.+?(mobile\s?safari|safari)((\/[\w\.]+))/i                   // Safari < 3.0
            ], [NAME, [MAJOR, mapper.str, maps.browser.oldsafari.major], [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(konqueror)\/((\d+)?[\w\.]+)/i,                                    // Konqueror
            /(webkit|khtml)\/((\d+)?[\w\.]+)/i
            ], [NAME, VERSION, MAJOR], [

            // Gecko based
            /(navigator|netscape)\/((\d+)?[\w\.-]+)/i                           // Netscape
            ], [[NAME, 'Netscape'], VERSION, MAJOR], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?((\d+)?[\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix)\/((\d+)?[\w\.-]+)/i,
                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/((\d+)?[\w\.]+).+rv\:.+gecko\/\d+/i,                    // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf)[\/\s]?((\d+)?[\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf
            /(links)\s\(((\d+)?[\w\.]+)/i,                                      // Links
            /(gobrowser)\/?((\d+)?[\w\.]+)*/i,                                  // GoBrowser
            /(ice\s?browser)\/v?((\d+)?[\w\._]+)/i,                             // ICE Browser
            /(mosaic)[\/\s]((\d+)?[\w\.]+)/i                                    // Mosaic
            ], [NAME, VERSION, MAJOR]

            /* /////////////////////
            // Media players BEGIN
            ////////////////////////

            , [

            /(apple(?:coremedia|))\/((\d+)[\w\._]+)/i,                          // Generic Apple CoreMedia
            /(coremedia) v((\d+)[\w\._]+)/i
            ], [NAME, VERSION, MAJOR], [

            /(aqualung|lyssna|bsplayer)\/((\d+)?[\w\.-]+)/i                     // Aqualung/Lyssna/BSPlayer
            ], [NAME, VERSION], [

            /(ares|ossproxy)\s((\d+)[\w\.-]+)/i                                 // Ares/OSSProxy
            ], [NAME, VERSION, MAJOR], [

            /(audacious|audimusicstream|amarok|bass|core|dalvik|gnomemplayer|music on console|nsplayer|psp-internetradioplayer|videos)\/((\d+)[\w\.-]+)/i,
                                                                                // Audacious/AudiMusicStream/Amarok/BASS/OpenCORE/Dalvik/GnomeMplayer/MoC
                                                                                // NSPlayer/PSP-InternetRadioPlayer/Videos
            /(clementine|music player daemon)\s((\d+)[\w\.-]+)/i,               // Clementine/MPD
            /(lg player|nexplayer)\s((\d+)[\d\.]+)/i,
            /player\/(nexplayer|lg player)\s((\d+)[\w\.-]+)/i                   // NexPlayer/LG Player
            ], [NAME, VERSION, MAJOR], [
            /(nexplayer)\s((\d+)[\w\.-]+)/i                                     // Nexplayer
            ], [NAME, VERSION, MAJOR], [

            /(flrp)\/((\d+)[\w\.-]+)/i                                          // Flip Player
            ], [[NAME, 'Flip Player'], VERSION, MAJOR], [

            /(fstream|nativehost|queryseekspider|ia-archiver|facebookexternalhit)/i
                                                                                // FStream/NativeHost/QuerySeekSpider/IA Archiver/facebookexternalhit
            ], [NAME], [

            /(gstreamer) souphttpsrc (?:\([^\)]+\)){0,1} libsoup\/((\d+)[\w\.-]+)/i
                                                                                // Gstreamer
            ], [NAME, VERSION, MAJOR], [

            /(htc streaming player)\s[\w_]+\s\/\s((\d+)[\d\.]+)/i,              // HTC Streaming Player
            /(java|python-urllib|python-requests|wget|libcurl)\/((\d+)[\w\.-_]+)/i,
                                                                                // Java/urllib/requests/wget/cURL
            /(lavf)((\d+)[\d\.]+)/i                                             // Lavf (FFMPEG)
            ], [NAME, VERSION, MAJOR], [

            /(htc_one_s)\/((\d+)[\d\.]+)/i                                      // HTC One S
            ], [[NAME, /_/g, ' '], VERSION, MAJOR], [

            /(mplayer)(?:\s|\/)(?:(?:sherpya-){0,1}svn)(?:-|\s)(r\d+(?:-\d+[\w\.-]+){0,1})/i
                                                                                // MPlayer SVN
            ], [NAME, VERSION], [

            /(mplayer)(?:\s|\/|[unkow-]+)((\d+)[\w\.-]+)/i                      // MPlayer
            ], [NAME, VERSION, MAJOR], [

            /(mplayer)/i,                                                       // MPlayer (no other info)
            /(yourmuze)/i,                                                      // YourMuze
            /(media player classic|nero showtime)/i                             // Media Player Classic/Nero ShowTime
            ], [NAME], [

            /(nero (?:home|scout))\/((\d+)[\w\.-]+)/i                           // Nero Home/Nero Scout
            ], [NAME, VERSION, MAJOR], [

            /(nokia\d+)\/((\d+)[\w\.-]+)/i                                      // Nokia
            ], [NAME, VERSION, MAJOR], [

            /\s(songbird)\/((\d+)[\w\.-]+)/i                                    // Songbird/Philips-Songbird
            ], [NAME, VERSION, MAJOR], [

            /(winamp)3 version ((\d+)[\w\.-]+)/i,                               // Winamp
            /(winamp)\s((\d+)[\w\.-]+)/i,
            /(winamp)mpeg\/((\d+)[\w\.-]+)/i
            ], [NAME, VERSION, MAJOR], [

            /(ocms-bot|tapinradio|tunein radio|unknown|winamp|inlight radio)/i  // OCMS-bot/tap in radio/tunein/unknown/winamp (no other info)
                                                                                // inlight radio
            ], [NAME], [

            /(quicktime|rma|radioapp|radioclientapplication|soundtap|totem|stagefright|streamium)\/((\d+)[\w\.-]+)/i
                                                                                // QuickTime/RealMedia/RadioApp/RadioClientApplication/
                                                                                // SoundTap/Totem/Stagefright/Streamium
            ], [NAME, VERSION, MAJOR], [

            /(smp)((\d+)[\d\.]+)/i                                              // SMP
            ], [NAME, VERSION, MAJOR], [

            /(vlc) media player - version ((\d+)[\w\.]+)/i,                     // VLC Videolan
            /(vlc)\/((\d+)[\w\.-]+)/i,
            /(xbmc|gvfs|xine|xmms|irapp)\/((\d+)[\w\.-]+)/i,                    // XBMC/gvfs/Xine/XMMS/irapp
            /(foobar2000)\/((\d+)[\d\.]+)/i,                                    // Foobar2000
            /(itunes)\/((\d+)[\d\.]+)/i                                         // iTunes
            ], [NAME, VERSION, MAJOR], [

            /(wmplayer)\/((\d+)[\w\.-]+)/i,                                     // Windows Media Player
            /(windows-media-player)\/((\d+)[\w\.-]+)/i
            ], [[NAME, /-/g, ' '], VERSION, MAJOR], [

            /windows\/((\d+)[\w\.-]+) upnp\/[\d\.]+ dlnadoc\/[\d\.]+ (home media server)/i
                                                                                // Windows Media Server
            ], [VERSION, MAJOR, [NAME, 'Windows']], [

            /(com\.riseupradioalarm)\/((\d+)[\d\.]*)/i                          // RiseUP Radio Alarm
            ], [NAME, VERSION, MAJOR], [

            /(rad.io)\s((\d+)[\d\.]+)/i,                                        // Rad.io
            /(radio.(?:de|at|fr))\s((\d+)[\d\.]+)/i
            ], [[NAME, 'rad.io'], VERSION, MAJOR]

            //////////////////////
            // Media players END
            ////////////////////*/

        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /(ia64(?=;)|68k(?=\))|arm(?=v\d+;)|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM, IRIX, MIPS, SPARC, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\);-]+(rim|apple)/i                         // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple']], [

            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/[\w\.]+.*silk\//i                               // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/[\w\.]+.*silk\//i                  // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|huawei|meizu|motorola|polytron)[\s_-]?([\w-]+)*/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Huawei/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\((bb10);\s(\w+)/i                                                 // BlackBerry 10
            ], [[VENDOR, 'BlackBerry'], MODEL, [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+((transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7))/i
            ], [[VENDOR, 'Asus'], MODEL, [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])/i                                           // Sony Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /((playstation)\s[3portablevi]+)/i                                  // Playstation
            ], [[VENDOR, 'Sony'], MODEL, [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(Lenovo)\s?(S(?:5000|6000)+(?:[-][\w+]))/i                         // Lenovo tablets
            ], [[VENDOR, 'Lenovo'], MODEL, [TYPE, TABLET]], [

            /(htc)[;_\s-]+([\w\s]+(?=\))|\w+)*/i,                               // HTC
            /(zte)-(\w+)*/i,                                                    // ZTE
            /(alcatel|geeksphone|huawei|lenovo|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]+)*/i
                                                                                // Alcatel/GeeksPhone/Huawei/Lenovo/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s((milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?(:?\s4g)?))[\w\s]+build\//i,
            /(mot)[\s-]?(\w+)*/i
            ], [[VENDOR, 'Motorola'], MODEL, [TYPE, MOBILE]], [
            /android.+\s((mz60\d|xoom[\s2]{0,2}))\sbuild\//i
            ], [[VENDOR, 'Motorola'], MODEL, [TYPE, TABLET]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n8000|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-n900))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)*/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [
            /(sie)-(\w+)*/i                                                     // Siemens
            ], [[VENDOR, 'Siemens'], MODEL, [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]+)*/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android\s3\.[\s\w-;]{10}((a\d{3}))/i                               // Acer
            ], [[VENDOR, 'Acer'], MODEL, [TYPE, TABLET]], [

            /android\s3\.[\s\w-;]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, [TYPE, SMARTTV]], [
            /((nexus\s[45]))/i,                                                 // LG
            /(lg)[e;\s\/-]+(\w+)*/i
            ], [[VENDOR, 'LG'], MODEL, [TYPE, MOBILE]], [
                
            /android.+((ideatab[a-z0-9\-\s]+))/i                                // Lenovo
            ], [[VENDOR, 'Lenovo'], MODEL, [TYPE, TABLET]], [
                
            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /(mobile|tablet);.+rv\:.+gecko\//i                                  // Unidentifiable
            ], [[TYPE, util.lowerize], VENDOR, MODEL]
        ],

        engine : [[

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m)\/([\w\.]+)/i,     // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]+).*(gecko)/i                                           // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*|windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]+)*/i,                                    // Blackberry
            /(tizen)\/([\w\.]+)/i,                                              // Tizen
            /(android|webos|palm\os|qnx|bada|rim\stablet\sos|meego)[\/\s-]?([\w\.]+)*/i,
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo
            /linux;.+(sailfish);/i                                              // Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]+)*/i                 // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids3portablevu]+)/i,                    // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w+)*/i,                                           // Mint
            /(joli|[kxln]?ubuntu|debian|[open]*suse|gentoo|arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk)[\/\s-]?([\w\.-]+)*/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk
            /(hurd|linux)\s?([\w\.]+)*/i,                                       // Hurd/Linux
            /(gnu)\s?([\w\.]+)*/i                                               // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.]+\d)*/i                                           // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]+)*/i                   // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(ip[honead]+)(?:.*os\s*([\w]+)*\slike\smac|;\sopera)/i             // iOS
            ], [[NAME, 'iOS'], [VERSION, /_/g, '.']], [

            /(mac\sos\sx)\s?([\w\s\.]+\w)*/i                                    // Mac OS
            ], [NAME, [VERSION, /_/g, '.']], [

            // Other
            /(haiku)\s(\w+)/i,                                                  // Haiku
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.]*)*/i,                               // AIX
            /(macintosh|mac(?=_powerpc)|plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS
            /(unix)\s?([\w\.]+)*/i                                              // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////


    var UAParser = function (uastring, extensions) {

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

        this.getBrowser = function () {
            return mapper.rgx.apply(this, rgxmap.browser);
        };
        this.getCPU = function () {
            return mapper.rgx.apply(this, rgxmap.cpu);
        };
        this.getDevice = function () {
            return mapper.rgx.apply(this, rgxmap.device);
        };
        this.getEngine = function () {
            return mapper.rgx.apply(this, rgxmap.engine);
        };
        this.getOS = function () {
            return mapper.rgx.apply(this, rgxmap.os);
        };
        this.getResult = function() {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        this.setUA(ua);
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR,
        VERSION : VERSION  
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION  
    };


    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof(module) !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // browser env
        window.UAParser = UAParser;
        // requirejs env (optional)
        if (typeof(define) === FUNC_TYPE && define.amd) {
            define(function () {
                return UAParser;
            });
        }
        // jQuery/Zepto specific (optional)
        var $ = window.jQuery || window.Zepto;
        if (typeof($) !== UNDEF_TYPE) {
            var parser = new UAParser();
            $.ua = parser.getResult();
            $.ua.get = function() {
                return parser.getUA();
            };
            $.ua.set = function (uastring) {
                parser.setUA(uastring);
                var result = parser.getResult();
                for (var prop in result) {
                    $.ua[prop] = result[prop];
                }
            };
        }
    }

})(this);
// %fv: ubase.js-43.2.8.1.17:ascii:1 % %dc: Fri Aug 28 09:56:54 2015 %
/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
080411 c26508    9.ajax  tsk mashup enablement
080508 c26571    9.ajax  zhu add more API function for unit test
080611 c26696    9.ajax  zhu Move command-related methods from ubase to udatalayer
140207 c29964    10.1.01 mbg Changed and aligned the trace output of CAT_HTML & CAT_CODE & CAT_JAVASCRIPT used a semicolon as seperator 
140826 c30273    10.1.01 tsk Use uniface-provided split only if browser's split is broken
150519 c31365    970101  tsk Support OUT parameters and return value for JS activate and createInstance
date   refnum    version who description
*******************************************************************************/
/*global JSON _uf _uf_trace UNIFACE uniface document alert setImmediate Promise */

(function(global)
{
    if ((typeof console === 'undefined') || (typeof console.log === 'undefined')) {
        console = {
            log: function(aMessage) {
                // This empty function is in case the browser does not support console logging.
            }
        };
    }

    // Polyfills - remove when we drop IE8
    if (!global.Object.keys) {
        Object.keys = function (o) {
            if (o !== global.Object(o)) {
                throw new TypeError('Object.keys called on a non-object');
            }
            var k = [], p;
            for (p in o) if (global.Object.prototype.hasOwnProperty.call(o, p)) {
                k.push(p);
            }
            return k;
        };
    }
	
    function fix_ie() {
        // There is a bug in IE8's JSON.stringify method.
        // Roughly speaking, when it stringifies an empty string that originates
        // from access to a DOM element, it returns "null" instead of "".
        // This piece of code is meant as a work around for this problem.
        if (global.JSON.stringify(document.createElement("input").value) !== '""') {
            // This must be IE8.
            var unchangedStringify = global.JSON.stringify,
                my_replacer = function (key, val) {
                    return (val === "" ? "" : val);
                };
            global.JSON.stringify = function (value, replacer, space) {
                return unchangedStringify(value, replacer ? replacer : my_replacer, space);
            };
        }
    }

    fix_ie();
	
})(this);

(function (global) {
    function Ev() {
        var listenerLastId = 0;
        var listenerMap = {};
        var results = [];
        this.clearListeners = function () {
            listenerMap = {};
        };

        this.fire = function () {
            var l_id,
            // The listenerMap may be modified during the run so we create a copy first....
                l_map = {},
                l_results = [];
            for (l_id in listenerMap) if (listenerMap.hasOwnProperty(l_id)) {
                l_map[l_id] = listenerMap[l_id];
            }

            var l_eventObject =
            {
                keepListening: function () {
                    listenerMap[l_id] = l_map[l_id];
                },
                stopListening: function () {
                    if (listenerMap[l_id]) {
                        delete listenerMap[l_id];
                    }
                }
            };
            for (l_id in l_map) if (l_map.hasOwnProperty(l_id)) {

                if (!l_map[l_id].keep) {
                    delete listenerMap[l_id];
                }
                l_results.push(l_map[l_id].listener.apply(l_eventObject, arguments));
            }
            return l_results;
        };

        this.addListener = function (aListener, aShouldKeep) {
            listenerLastId++;
            var id = "" + listenerLastId;
            listenerMap[id] = {
                listener: aListener,
                keep: (aShouldKeep ? aShouldKeep : false)
            };
            return id;
        };

        this.removeListener = function (anId) {
            delete listenerMap[anId];
        };
    }

    _uf = {
        ieVersion: function() {
            var v = undefined;
            var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
            if (match) {
                v = parseInt(match[1], 10);
            }
            return v;  
        },
        is_safari: function(){
            return (navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1);
        },
        nop: function () { },
        nstr: function () { return ""; },
        namespace: function () {
            var l_args = arguments;
            var l_root = this;
            var i, j;
            for (i = 0; i < l_args.length; i++) {
                var l_splitout = l_args[i].split(".");
                for (j = 0; j < l_splitout.length; j++) {
                    // If it doesn't exist, create it...
                    if (typeof (l_root[l_splitout[j]]) === "undefined") {
                        l_root[l_splitout[j]] =
                        {
                            extend: UNIFACE.extend
                        };
                    }
                    l_root = l_root[l_splitout[j]];
                }
            }
            return l_root;
        },
        Event: Ev,
		scope: ["nodes", "mergeprops", "requestScope" ]
    };
})(this);

(function (global) {
    'use strict';
    var unbind = {};
    if (global.Node && global.Node.prototype && !global.Node.prototype.contains)
    {
        global.Node.prototype.contains = function (arg) {
            return !!(this.compareDocumentPosition(arg) & 16);
        };
    }

    global.UNIFACE={   // Global
        extend: function(a, cond)
        {
            var j;
            for (j in a) if (a.hasOwnProperty(j) && (!cond || cond(j) ))
            {
                this[j] = a[j];
            }
        },
        components: {},
        namespace: _uf.namespace,
        unbind: unbind,
        bind : function(method, object) {
            var g_args = [].slice.call(arguments, 0).slice(2);
            return function (a_1) {
                if (a_1 === unbind) {
                    g_args = method = object = null;
                } else if (method !== null) {
                    return method.apply(object, g_args.concat([].slice.call(arguments, 0)));
                }
            };
        },
        throwException : function(e, showPopup) {
            var msg = e ? e.toString() : "<null>";
            if (showPopup === undefined || showPopup === true) {
                UNIFACE.extension.popupWindow.showMessage(msg, "OK", "UNIFACE RIA Exception", 0, 0, "error");
            }
            throw e;
        },

        getURLParam : function( a_name )
        {
            var regex = new RegExp( "[\\?&]"+a_name+"=([^&#]*)" );
            var results =global.location.href.match(regex, "i" );
            if( results === null )
            {
                return "";
            }
            else
            {
                return results[1];
            }
        }
    };
})(this);

/*
 * UNIFACE extension for "onLoad" event handling
 */
UNIFACE.extend(
function (global) {
    var preLoadListeners = [];
    var onLoadListeners = [];
    var onUnloadListeners = [];
    var postLoadListeners = [];
    
    function _fire(listeners) {
        var i;
        for (i = 0; i < listeners.length; i++ ) {
            listeners[i]();
        }
    }
     
    function _onload(){
        _fire(preLoadListeners);
        _fire(onLoadListeners);

        _uf.commands.add({ "postload" : null}).then(function () { _fire(postLoadListeners); });
        UNIFACE.loaded = true;
    }

    function _onunload(){
        _fire(onUnloadListeners);
    }
    
    if (global.addEventListener) {
        global.addEventListener("load", _onload, false);
        global.addEventListener("unload", _onunload, false);
    } else if (global.attachEvent) {
        global.attachEvent("onload", _onload);
        global.attachEvent("onunload", _onunload);
    }
    
    return {
        addPreLoadListener : function(aListener) {
            preLoadListeners.push(aListener);
        },
        
        addOnLoadListener : function(aListener) {
            onLoadListeners.push(aListener);
        },
        
        addOnUnloadListener : function(aListener) {
            onUnloadListeners.push(aListener);
        },
        
        addPostLoadListener : function(aListener) {
            postLoadListeners.push(aListener);
        }
    };
}(this));

/*
 * UNIFACE.extension is the place to supply pluggable implementations
 * of functionality used by the UNIFACE framework.
 * In general such an implementation is plugged in by doing
 *          UNIFACE.extension.register("<extensionName>", <extensionObject>);
 * The extensionObject must implement extension-specific functions.
 */
UNIFACE.extension = (function() {
    // Registers an extension.
    // @param extensionName     Name of the extension
    // @param extension         The actual object to be registered
    // @throws An error message if UNIFACE does not accept an extension with the given name
    //          or if the extension does not implement its required functions.
    function _register(extensionName, extension) {
        if (UNIFACE.extension[extensionName] === undefined || extensionName == "register") {
            UNIFACE.throwException("UNIFACE does not accept an extension named \"" + extensionName + "\".");
        }
        // Check whether the required functions are defined.
        var requiredFunctions = UNIFACE.extension[extensionName].requiredFunctions,
            functionName, i;
        if (extension != undefined) { // pragma(allow-loose-compare)
            for (i = requiredFunctions.length - 1; i >= 0; i = i - 1) {
                functionName = requiredFunctions[i];
                if (typeof extension[functionName] != "function") {
                    UNIFACE.throwException("The " + extensionName + " extension has no " + functionName + "function!");
                }
            }
        }
        // All checks passed; register the extension.
        UNIFACE.extension[extensionName].extension = extension;
    }
    
    /*
     * BusyIndicator extension point.
     */
    var _busyIndicator = (function() {
        return {
            requiredFunctions : ["setBusySync", "setBusyAsync"],
            setBusySync : function(isBusy) {
                if (this.extension != undefined) {  // pragma(allow-loose-compare)
                    this.extension.setBusySync(isBusy);
                }
            },
            setBusyAsync : function(isBusy) {
                if (this.extension != undefined) {  // pragma(allow-loose-compare)
                    this.extension.setBusyAsync(isBusy);
                }
            }
        };
    }());

    /*
     * PopupWindow extension point.
     */
    var _popupWindow = (function() {
        return {
            requiredFunctions : ["showMessage", "showFailure"],
            showMessage : function(message,buttontext,title,cx,cy,messageType) {
                if (this.extension != undefined) {  // pragma(allow-loose-compare)
                    this.extension.showMessage(title, message, buttontext, cx, cy, messageType);
                } else {
                    // Rudimentary fallback:
                    alert(message);
                }
            },
            showFailure : function(title, message, statusLineString, moreInfoText) {
                if (this.extension !== undefined) {  // pragma(allow-loose-compare)
                    this.extension.showFailure(title, message, statusLineString, moreInfoText);
                } else {
                    // Rudimentary fallback:
                    alert("UNIFACE error: "+message);
                }
            }
        };
    }());

    return {
        register : _register,
        busyIndicator : _busyIndicator,
        popupWindow : _popupWindow
    };
}());


/**
 *
 * @param aMsg
 */
UNIFACE.trace = function(aMsg) { };

// TODO: remove this debug in release
if (typeof(_uf_trace) === "function") {
    var instance, instanceName;
    UNIFACE.isTracing = true;
    UNIFACE.trace = function(msg) {
        var instance = uniface.getInstance();
        if (instance) {
            instanceName = instance.getName();
        }
        if (!instanceName) {
            instanceName = "No-current-instance";
        }
        _uf_trace(instanceName+"; " + msg);
    };
}

/**
 * @c30273  Use uniface-provided split only if browser's split is broken
 */
if ("b".split(/(b)/).length === 3)
{
    // No issues with split, use local browser implementation
    UNIFACE.splitString = function(a_src, a_re) {
        return a_src.split(a_re);
    };
}
else
{
    // Since internet explorer's String.prototype.split method is *buggy* we use this method instead...
    UNIFACE.splitString = function(a_src, a_re)
    {
        var l_outp = [];
        var l_lastIdx = 0;
        var l_match;

        if (!a_re.global)
        {
            a_re = new RegExp(a_re.source, "g");
        }

        while ((l_match = a_re.exec(a_src)) !== null) {
            if ((l_match[0].length === 0) && a_re.lastIndex > l_match.index)
            {
                a_re.lastIndex = l_match.index;
            }

            if (a_re.lastIndex > l_lastIdx) {
                l_outp = l_outp.concat(a_src.slice(l_lastIdx, l_match.index), (l_match.index === a_src.length ? [] : l_match.slice(1)));
                l_lastIdx = a_re.lastIndex;
            }

            if (l_match[0].length === 0)
            {
                a_re.lastIndex++;
            }
        }
        // Remainder of the string, after the last match
        return (l_lastIdx === a_src.length) ? l_outp.concat("") : l_outp.concat(a_src.slice(l_lastIdx));
    };
}
// %fv: ulicense.js-4:ascii:1 % %dc: Mon Jun 29 15:20:30 2015 %
/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
150618 c31483    970101  jsn Add cookie for Uniface mobile app specific requests
*******************************************************************************/
/*global UNIFACE */
(function () {

/* This function is called when the device ready. Then set the cookie specifying a uniface-app request */
function onUnifaceDeviceReady() {
    var vname = "unifaceapp";
    var vvalue = "true";
    document.cookie = encodeURIComponent(vname) + "=" + encodeURIComponent(vvalue);
}

UNIFACE.addPreLoadListener(function () {
    /* For webview access : register a deviceready event handler */
    if (window.cordova) {
        document.addEventListener("deviceready", onUnifaceDeviceReady);
    }
});

})();
/*global Promise _uf UNIFACE uniface document */
;(function(){

    'use strict';

    // TODO: move this to a _uf.constants module
    var UID_PREFIXES = {
        'uent:': '',
        'ufld:': '',
        'ulbl:': '',
        'uocc:': '',
        'uoce:': '',
        'uocs:': '',
		"uflderror:": ''
    };

    /**
     * A manager for DOM Nodes. Singleton.<br>
     * <br>
     * For now, it acts as a store, where a key is a uniface ID, and the value
     * is a HTMLElement reference.
     *
     * @type {Object}
     *
     * @memberof _uf
     */
    _uf.DOMNodeManager = {

        /**
         * The internal store
         *
         * @type {Object}
         * @private
         */
        _storage: {},

        /**
         * Adds a node reference to the store. Will overwrite existing entries.
         *
         * @param {String} key The uniface ID for the given node reference
         * @param {String} instanceName The name of the instance the node
         *      belongs to
         * @param {HTMLElement} nodeReference The node reference to store
         */
        add: function (key, instanceName, nodeReference) {
            if (!this._storage[instanceName]) {
                this._storage[instanceName] = {};
            }
            this._storage[instanceName][key] = nodeReference;
        },

        /**
         * Retrieves a node reference from the store. Will return `undefined` if
         * no entry is present for the given key.
         *
         * @param {String} key The uniface ID for the given node reference
         * @param {String} instanceName The name of the instance the node
         *      belongs to
         * @returns {HTMLElement|undefined} The node reference if found,
         *      `undefined` if not
         */
        fetch: function (key, instanceName) {
            if (!this._storage[instanceName]) {
                return;
            }
            return this._storage[instanceName][key];
        },

        /**
         * Parses a DOM tree starting at node for nodes containing IDs
         * that indicate they are relevant to Uniface. Will add hits to store.
         * Will not check `node` itself, only it's children.
         *
         * //TODO: This could use some refactoring and improved var names
         *
         * @param {Node} node The node to start parsing at
         * @param {String} instanceName The name of the instance that wants to
         *      add nodes to the store
         */
        parse: function (node, instanceName) {
            var _luv = UNIFACE.luv;

            if (node === _luv.parkingPlace) {
                return;
            }

            var len0 = (typeof instanceName === "string") ? instanceName.length : 0;
            if (len0 === 0) {
                return;
            }
            var suffix = _luv.constants.UINS_SEPARATOR + instanceName;
            len0++;

            function addSuffix (_aNode) {

                if (!_aNode.id) {
                    return;
                }

                if (_aNode.id != null // pragma(allow-loose-compare)
					&& UID_PREFIXES.hasOwnProperty(_aNode.id.substring(0, _aNode.id.indexOf(':') + 1 ).toLowerCase())) {
                    var l = _aNode.id.length;
                    if (l < len0 || _aNode.id.substring(l - len0, l) !== suffix) {
                        this.add(_aNode.id, instanceName, _aNode);
                        _aNode.id = _aNode.id + suffix;
                    } else {
                        this.add(_aNode.id.substring(0, l - len0), instanceName, _aNode);
                    }
                }
            }

            for (node = node.firstChild; node !== null; node = node.nextSibling) {
                addSuffix.call(this, node);
                this.parse(node, instanceName);
            }
        }
    };

})();
/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*global JSON _uf _uf_trace UNIFACE uniface document alert setImmediate Promise */

/**
 *
 * @type {{PRE_CLUSTERING: number, CAPTURING: number, BUBBLING: number}}
 */
UNIFACE.eventPhase = {
    PRE_CLUSTERING : 1,
    CAPTURING      : 2,
    BUBBLING       : 3
};


/**
 *
 * @param source
 * @param eventName
 * @param f
 * @param eventPhase
 */
UNIFACE.addEventListener = function (source, eventName, f, eventPhase) {
    var useCapture;
    if (eventPhase == UNIFACE.eventPhase.PRE_CLUSTERING || eventPhase == UNIFACE.eventPhase.CAPTURING)
    {
        useCapture = true;
    }
    if (source.addEventListener) {
        source.addEventListener(eventName.substring(2), f, useCapture);
    } else if (source.attachEvent) {
        source.attachEvent(eventName, f);
    } else {
        source[eventName] = f;
    }
};


/**
 *
 * @param source
 * @param eventName
 * @param f
 * @param eventPhase
 */
UNIFACE.addListener = function(source, eventName, f, eventPhase)
{
    if (typeof f === "function") {
        if (f.registered)
        {
            if (!f.listenerOf)
            {
                f.listenerOf = [];
            }
            f.listenerOf.push( { src: source, evt: eventName });
        }
        UNIFACE.addEventListener(source, eventName, f, eventPhase);
    }
};


/**
 *
 * @param source
 * @param eventName
 * @param f
 */
UNIFACE.removeListener = function(source, eventName, f)
{
    if (source.removeEventListener) {
        source.removeEventListener(eventName.substring(2), f, false);
    } else if (source.detachEvent) {
        source.detachEvent(eventName, f);
    } else {
        source[eventName] = _uf.nop;
    }
};


///////////////////////////////////////////////////////////////////////////////
// UNIFACE.eventMapper
// Object that maps widget events to field triggers and keeps track of those
// mappings so that they can be undone on page unload.
///////////////////////////////////////////////////////////////////////////////
/**
 *
 * @type {{register, clearForId}}
 */
UNIFACE.eventMapper = (function() {
    var mappings = {};

    /**
     *
     * @param objectId
     * @param eventName
     * @param f
     * @private
     */
    function _register(objectId, eventName, f) {
        if (typeof f === "function") {
            if (!mappings[objectId]) {
                mappings[objectId] = [];
            }
            var mapping = { evt:eventName, listener:f };
            mappings[objectId].push(mapping);
            f.registered = true;
        }
    }

    /**
     *
     * @param id
     * @private
     */
    function _clearForId(id) {
        var widgetMappings = mappings[id];
        if (widgetMappings) {
            var mapping, j, i, l_f;
            // Loop through the mappings and deregister the event listeners.
            for ( i = widgetMappings.length-1; i >= 0; i--) {
                mapping = widgetMappings[i];
                l_f =  mapping.listener;
                l_f(UNIFACE.unbind);
                l_f.registered = false;
                if (l_f.listenerOf)
                {
                    for (j=0; j < l_f.listenerOf.length; j++)
                    {
                        UNIFACE.removeListener(l_f.listenerOf[j].src, l_f.listenerOf[j].evt, l_f);
                    }
                }

            }
            // Remove the mapping from the admin.
            mappings[id] = null;
        }
    }

    /**
     *
     * @private
     */
    function _clearAll() {
        var id;
        for (id in mappings) if (mappings.hasOwnProperty(id)) {
            _clearForId(id);
        }
        mappings = {};
    }

    /**
     *
     */
    UNIFACE.addOnUnloadListener(_clearAll);

    return {
        register: _register,
        clearForId: _clearForId
    };
}());


(function (global, Uniface_Event) {  // @c27361 Commands module
    "use strict";
    var _macros = [],
        _frozen = 0,
        _handlers = { idle: new Uniface_Event(), queueEmpty: new Uniface_Event() },
        _commands = [],
        _preCommandEvents = {},
        _postCommandEvents = {};

    /**
     *
     * @param a_cmd
     * @param a_data
     * @param a_request
     * @constructor
     */
    function Command(a_cmd, a_data, a_request) {
        this.cmd = a_cmd;
        this.data = a_data;
        this.req = a_request;
        var me = this,
            promise = new global.Promise(function (resolve, reject) {
                me.resolve = resolve;
                me.reject = reject;
            });
        this.then = function () {
            return promise.then.apply(promise, arguments);
        };
    }

    /**
     *
     * @param aCmdName
     * @param aCmdData
     * @returns {Command}
     * @private
     */
    function _addMacro(aCmdName, aCmdData) {
        var l_cmd = new Command(aCmdName, aCmdData);
        _macros.push(l_cmd);
        return l_cmd;
    }


    Command.prototype = {
        execute: function () {
            var l_cmd = this.cmd.toLowerCase(),
                l_resolve_value=[];
            if (_preCommandEvents[l_cmd] !== undefined) {
                _preCommandEvents[l_cmd].fire(l_cmd, this.data, this.req);
            }


            UNIFACE.trace("Command: " + l_cmd);
            switch (l_cmd) {
                case "apptitle":
                    document.title = this.data;
                    break;
                case "callback":
                    if (typeof this.data === "function") {
                        this.data();
                    }
                    break;
                case "webmessage":
                    UNIFACE.extension.popupWindow.showMessage(this.data.message, this.data.buttontext, this.data.title,
                        parseInt(this.data.xsize, 10), parseInt(this.data.ysize, 10), this.data.type);
                    break;
                case "macro":
                    l_resolve_value.push(_addMacro("weboperation", this.data));
                    break;
                default:
                    if (_handlers.hasOwnProperty(l_cmd)) {
                        l_resolve_value = _handlers[l_cmd].fire(this.data, this.req);
                    }
            }
            if (_postCommandEvents[l_cmd] !== undefined) {
                _postCommandEvents[l_cmd].fire(l_cmd, this.data, this.req);
            }
            var me = this;
            Promise.all(l_resolve_value).then(
                function (val) {
                    me.resolve(val);
                }, function (E) {
                    me.reject(E);
                });
        }
    };

    /**
     *
     * @private
     */
    function _iCommands() {
        //try {
        while (!_frozen && _commands.length > 0) {
            _commands.shift().execute();
        }
        /*}
         catch (e) {
         UNIFACE.trace(global.JSON.stringify(e));
         throw e;
         }*/
    }

    var _isRunningCommands = false;  // for avoiding recursive call of runCommands
    var _isRunningJSAPI = false;     // for avoiding firing triggers during JavaScript API calls


    /**
     *
     * @param a_commandSet
     * @param a_request
     * @returns {*}
     */
    function addCommands(a_commandSet, a_request) {
        var l_promises = [];
        if (typeof a_commandSet == "string") {
            return addCommands(JSON.parse(a_commandSet), a_request);
        }
        else if (typeof a_commandSet == "object" && a_commandSet) {
            if (a_commandSet.constructor === Array) {
                var idx;
                for (idx = 0; idx < a_commandSet.length; idx++) {
                    l_promises.push(addCommands(a_commandSet[idx], a_request));
                }
            }
            else {
                var l_cmd;
                for (l_cmd in a_commandSet) if (a_commandSet.hasOwnProperty(l_cmd)) {
                    var l_promise = new Command(l_cmd, a_commandSet[l_cmd], a_request);
                    l_promises.push(l_promise);
                    _commands.push(l_promise);
                }
            }
        }
        return global.Promise.all(l_promises);
    }

    /**
     *
     * @returns {boolean}
     */
    function isIdle() {
        return (!_frozen && _commands.length === 0 && _macros.length === 0);
    }

    /**
     *
     */
    function runNow(){
        if (_isRunningCommands) {
            return; // no recursive call
        }
        _isRunningCommands = true;
        try {
            _iCommands();

            while (!_frozen && _macros.length > 0) {
                _macros.shift().execute();
                _iCommands();
            }
            if (isIdle()) {
                _handlers.queueEmpty.fire();
            }
        }
        finally {
            if (!_frozen) {
                _isRunningCommands = false;
                if (isIdle()) {
                    _handlers.idle.fire();
                }
            }
        }
    }

    /**
     *
     */
    function run() {
        setImmediate(runNow);
        runNow();
    }

    /**
     *
     * @returns {boolean}
     */
    function isProcessingServerResponse () {
        return _isRunningCommands && !_frozen;
    }

    /**
     *
     * @type {{executeWithoutEvents: Function, run: run, isIdle: isIdle, forceIdle: Function, freeze: Function, thawe: Function, isProcessingServerResponse: isProcessingServerResponse, isProcessing: Function, on: Function, preCommandEvent: Function, postCommandEvent: Function, Command: Command, add: addCommands}}
     */
    _uf.commands = {
        // Execute function fnc,
        // setting the _isRunningJSAPI flag while it runs.
        executeWithoutEvents: function (fnc) {
            var sav = _isRunningJSAPI;
            _isRunningJSAPI = true;   // Disable firing of triggers while fnc() is executed.
            try {
                fnc();
            } finally {
                _isRunningJSAPI = sav;
            }
        },
        run: run,
        isIdle: isIdle,
        forceIdle: function () {  // Used only by UDOH
            if (_isRunningCommands) {
                return false;
            }
            _commands = [];
            _macros = [];
            return true;
        },

        freeze: function () {
            ++_frozen;
        },
        thawe: function () {
            if (_frozen) {
                --_frozen;
                if (!_frozen) {
                    _isRunningCommands = false;
                    setImmediate(_uf.commands.run);
                }
            }
        },
        isProcessingServerResponse: isProcessingServerResponse,
        isProcessing: function () {
            return isProcessingServerResponse() || _isRunningJSAPI;
        },
        on: function (command, f) {
            if (!_handlers.hasOwnProperty(command)) {
                _handlers[command] = new Uniface_Event();
            }
            _handlers[command].addListener(f, true);
        },
        preCommandEvent: function (aCmd) {
            if (_preCommandEvents[aCmd] === undefined) {
                _preCommandEvents[aCmd] = new Uniface_Event();
            }
            return _preCommandEvents[aCmd];
        },

        postCommandEvent: function (aCmd) {
            if (_postCommandEvents[aCmd] === undefined) {
                _postCommandEvents[aCmd] = new Uniface_Event();
            }
            return _postCommandEvents[aCmd];
        },
        Command: Command,
        add: addCommands
    };

	UNIFACE.addPreLoadListener(run);
    UNIFACE.addOnLoadListener(run);
}(this, _uf.Event)); //  Closure of commands namespace



(function (global, _uf_cmd) { // loader module
    "use strict";

    /**
     * Dynamically add script to a page. This occurs when a DSP container loads a DSP that introduces new widgets,
     * in response to a "JS" command from the JSON stream.
     * The a_ONLOAD is called as soon as the script has finished loading.
     *
     * @param a_src
     * @param a_onload
     * @param a_doc
     * @returns {Element}
     */
    function addScript(a_src, a_onload, a_doc) {
        a_doc = a_doc || document;
        a_doc._loadedScript = a_doc._loadedScript || {};
        var l_src = "";
        var l_text = "";
        if (typeof a_src === "object") {
            if ("src" in a_src) {
                l_src = a_src.src;
            }
            else if ("text" in a_src) {
                l_text = a_src.text;
            }
        }
        else {
            l_src = a_src;
        }

        var l_el = a_doc.createElement("script");
        if (l_src) {
            l_el.src = l_src;
            _uf_cmd.freeze();

            /*
             ** @b29004
             ** Internet Explorer (7 and 8) cannot find the base URL of dojo.js
             ** when it is loaded dynamically and eventually get errors.
             ** Therefore here is the implementation to set djConfig.baseUrl specifically.
             */
            // Search '/dojo.js' or '/dojo.xd.js'. First '\/' is needed to not match with '/udojo.js'.
            var m = l_src.match(/\/dojo(\.xd)?\.js(\W|$)/i);
            if (m) {
                // Extract the path info. Last '/' is necessary.
                var dojoPath = l_src.substring(0, m.index) + "/";

                // Set the path info into djConfig.baseUrl.
                global.djConfig = global.djConfig || {};
                global.djConfig.baseUrl = dojoPath;
            }
        }
        l_el.type = "text/javascript";
        l_el.setAttribute("charset", "UTF-8");
        if (l_text) {
            var l_tn = a_doc.createTextNode(l_text);
            l_el.appendChild(l_tn);
        }
        if (a_onload !== undefined) {
            if (l_el.readyState) {
                l_el.onreadystatechange = function () {
                    if (this.readyState == 'complete' || this.readyState == 'loaded') {
                        this.onreadystatechange = null;
                        a_onload();
                    }
                };
            } else {
                l_el.onload = a_onload;
                l_el.onerror = a_onload;
            }
        }
        a_doc.getElementsByTagName('head')[0].appendChild(l_el);

        return l_el;
    }




    /**
     * Dynamically add script to a page. This occurs when a DSP container loads a DSP that introduces new widgets,
     * in response to a "JS" command from the JSON stream.
     * This method is currently in use.
     *
     * It adds a <script> tag to the page, then subsequently freezes the command queue until the script tag has finished
     * loading.
     * This ensures that any dependencies are resolved in the corrent order, and that no attempt is made to realize widgets
     * whose implementation has not been loaded yet.
     *
     * @param a_JS
     * @param a_callback
     * @param doc
     * @returns {Element}
     */
    function addJS(a_JS, a_callback, doc) {
        doc = doc || document;
        doc._loadedScript = doc._loadedScript || {};
        doc._loading = doc._loading || {};
        /* Check that the script was not loaded yet */
        var l_elms = doc.getElementsByTagName('script');
        var l_existingElms = {};
        var i;
        for (i = 0; i < l_elms.length; i++) {
            if (l_elms[i].type === "text/javascript" && l_elms[i].src) {
                l_existingElms[l_elms[i].attributes.src.value] = true;
                l_existingElms[l_elms[i].src] = true;
            }
        }
        if (!(a_JS in l_existingElms) && !(a_JS in doc._loadedScript)) {
            doc._loadedScript[a_JS] = true;
            doc._loading[a_JS] = [a_callback];
            /* Load the script. When loading has finished, call the  _uf.commands.thawe()
             function to restart JS Processing*/
            return addScript(a_JS, function () {

                _uf_cmd.thawe();
                var l_callbacks = doc._loading[a_JS];
                delete doc._loading[a_JS];

                var i;
                for (i=0; i<l_callbacks.length; i++)
                {
                    if (typeof l_callbacks[i] === 'function') {
                        l_callbacks[i]();
                    }
                }
            }, doc);
        }
        else {
            if (doc._loading[a_JS]) {
                doc._loading[a_JS].push(a_callback);
            } else {
                if (typeof a_callback === 'function') {
                    a_callback();
                }
            }
        }
    }


    var l_elms = document.getElementsByTagName('script'),
    g_jsbase = '',

    i;
    for (i = 0; i < l_elms.length; i++) {
        if (l_elms[i].type === "text/javascript" && l_elms[i].src) {
            var l_base = l_elms[i].src.match(/(.*)ubase.js$/);
            if (l_base) {
                g_jsbase = l_base[1];
                break;
            }
        }
    }

    _uf.require = function (a_lib, a_callback, doc) {
        var l_callback = a_callback,
            l_prom;
        if (Promise) {
            l_prom = new Promise(function (resolve, reject) {
                l_callback = function () {
                    if (a_callback) {
                        a_callback.apply(this, arguments);
                    }
                    resolve();
                };
            });
        }
        addJS(g_jsbase + a_lib, l_callback, doc);
        return l_prom;
    };

    /**
     *
     */
    _uf_cmd.on("js", addJS);


    /**
     * Dynamically add CSS to a page. This occurs when a DSP container loads a DSP that introduces new widgets,
     * in response to a "CSS" command from the JSON stream.
     *
     * @param a_css
     */
    function addCSS(a_css) {
        var i;
        var l_elms = document.getElementsByTagName('link');
        var l_existingElms = {};
        for (i = 0; i < l_elms.length; i++) {
            if (l_elms[i].rel === "stylesheet" && l_elms[i].type === "text/css") {
                l_existingElms[l_elms[i].attributes.href.value] = true;
                l_existingElms[l_elms[i].href] = true;
            }
        }
        for (i = 0; i < a_css.length; i++) {
            if (!(a_css[i] in l_existingElms)) {
                var l_el = document.createElement("link");
                l_el.href = a_css[i];
                l_el.rel = "stylesheet";
                l_el.type = "text/css";
                document.getElementsByTagName('head')[0].appendChild(l_el);
            }
        }
    }

    /**
     *
     */
    _uf_cmd.on("css", function (data) { addCSS(data); });


}(this, _uf.commands)); // Outer closure


/**
 * For backward compatibility
 * @param a_cmd
 */
UNIFACE.initialCommand = function (a_cmd) { _uf.commands.add(a_cmd);  };


// Uniface FORMAT module
/*global UNIFACE define */
/// <reference path="moment.js" />

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define("uniface.format", ["moment"], function (m) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root._uf.format = factory(m));
        });
    } else {
        // Browser globals
        root._uf.format = factory(root.moment);
    }
}(this, function (moment) {
    function convertDateFormatString(a_pattern, a_type)
    {
        // All patterns allowed by Uniface in a date format.
        // Check for NLS:

        var l_nls = a_pattern.match(/\$nls\(([^\)]*)\)/i);
        if (l_nls && l_nls[1]) {
            var l_str = l_nls[1].match(/"([^"]*)"/);
            if (l_str) {
                a_pattern = l_str[1] || "";
            }
            else {
                var l_parts = l_nls[1].match(/ *(short|medium|long|full) *(, *(DATE|TIME|DATIM) *)$/i);
                if (l_parts && l_parts[1])
                {
                    if (l_parts[3])
                    {
                        a_type = l_parts[3].toLowerCase();
                    }
                    switch(l_parts[1].toLowerCase())
                    {
                        case "short":
                            switch (a_type)
                            {
                                case "date":
                                    return "l";
                                case "time":
                                    return "LT";
                                /*case "datetime":
                                case "datim":*/
                                default:
                                    return "l LT";
                            }
                            break;
                        case "medium":
                            switch (a_type)
                            {
                                case "date":
                                    return "ll";
                                case "time":
                                    return "LTS";
                                    /*case "datetime":
                                    case "datim":*/
                                default:
                                    return "lll";
                            }
                            break;                            
                        case "long":
                            switch (a_type)
                            {
                                case "date":
                                    return "LL";
                                case "time":
                                    return "LTS";
                                    /*case "datetime":
                                    case "datim":*/
                                default:
                                    return "LLL";
                            }
                            break;  
                        case "full":
                            switch (a_type)
                            {
                                case "date":
                                    return "dddd, LL";
                                case "time":
                                    return "LTS";
                                    /*case "datetime":
                                    case "datim":*/
                                default:
                                    return "LLLL";
                            }
                            break; 
                    }
                }
            }
        }
        
        // First get the Uniface date/datetime tokens...
        var l_sfs = UNIFACE.splitString(a_pattern, /([dz]?d|aa[a\*]?|mmm\*?|[mz]?m|[wz]?w|xxxx|xx|yyyy|yy|[zh]?h|[zn]?n|[zs]?s)/gi),
            i,
            l_ret="";

        // Now loop... 
        for (i = 0; i < l_sfs.length; ++i)
        {
            // First a non-date part: escape it
            if (l_sfs[i] && l_sfs[i].length)
            {
                l_ret += '[' + l_sfs[i].replace(']', '\\]') + ']';
            }

            // The a Uniface date code
            ++i;
            if (i < l_sfs.length && l_sfs[i])
            {
                a_pattern = l_sfs[i];
                // day
                a_pattern = a_pattern.replace(/[zd]d/i, "DD");
                a_pattern = a_pattern.replace(/d/i, "D");
                // weekday
                a_pattern = a_pattern.replace(/aaa/i, "ddd");
                a_pattern = a_pattern.replace(/aa\*/i, "dddd");
                a_pattern = a_pattern.replace(/aa/i, "dd");
                // month
                a_pattern = a_pattern.replace(/MMM\*/, "MMMM");
                a_pattern = a_pattern.replace(/[zm]M/i, "MM");
                a_pattern = a_pattern.replace(/m/gi, "M");
                // week number
                a_pattern = a_pattern.replace(/[zw]w/i, "ww");
                a_pattern = a_pattern.replace(/w/i, "w");

                // calendar year
                a_pattern = a_pattern.replace(/YYYY/i, "YYYY");
                a_pattern = a_pattern.replace(/YY/i, "YY");

                // fiscal year
                /*a_pattern = a_pattern.replace(/xxxx/i, "YYYY");
                a_pattern = a_pattern.replace(/xx/i, "YY");*/

                // hour
                a_pattern = a_pattern.replace(/[zh]h/i, "HH");
                a_pattern = a_pattern.replace(/h/i, "H");

                // minute
                a_pattern = a_pattern.replace(/[zn]n/i, "mm");
                a_pattern = a_pattern.replace(/n/i, "m");

                // seconds
                a_pattern = a_pattern.replace(/[zs]s/i, "ss");
                a_pattern = a_pattern.replace(/s/i, "s");
                l_ret += a_pattern;
            }
        }

        return l_ret;
    }

    function DateTimeFormatter(a_date_pattern, a_pattern, a_type)
    {
        var l_pattern = convertDateFormatString(a_pattern, a_type);
        this.format = function (a_data) {
            return a_data ? moment(a_data, a_date_pattern).format(l_pattern) : "";
        };
        this.deformat = function (a_data) {
            if (a_data) {
                var m = moment(a_data, l_pattern);
                if (!m.isValid()) {
                    m = moment(a_data);
                }
                return m.format(a_date_pattern);
            }
            else {
                return "";
            }
        };
    }

    function CheckboxFormatter()
    {
        this._inArray = function(needle, haystack) {
            var length = haystack.length;
            needle = needle.toLowerCase();
            for(var i = 0; i < length; i++) {
                if (haystack[i].toLowerCase() === needle) {
                    return true;
                }
            }
            return false;
        };

        this.format = function (a_data) {
            if (typeof a_data === 'boolean') {
                return a_data;
            } else if (typeof a_data === 'string') {
                a_data = a_data.toLowerCase();
                if (this._inArray(a_data, ['1', 't', 'true'])) {
                   return true; 
                } else if (this._inArray(a_data, ['0', 'f', 'false'])) {
                   return false;
                } else {
                   return false;
                }   
            } else if (typeof a_data === 'number') {
                return (a_data !== 0);
            } else {
                return false;
            }
        };
        this.deformat = function (a_data) {
            return a_data;
        };
    }
    
    function Nop(a) { return a;}
    var Nullformatter = { format: Nop, deformat: Nop };
    function createFormatter(displayFormat, data_type)
    {
        switch(data_type)
        {
            case "date":
                return new DateTimeFormatter("YYYY-MM-DD", displayFormat, data_type);
            case "datetime":
                return new DateTimeFormatter(moment.ISO_8601, displayFormat, data_type);
            case "time":
                return new DateTimeFormatter("HH:mm:ss.SS", displayFormat, data_type);
            case "checkbox":
                return new CheckboxFormatter();

            default:
                return Nullformatter;
        }
    }

    return {
        createFormatter: createFormatter,
        nullFormatter: Nullformatter
    };
}));

/*global UAParser */
(function (_uf) {
    'use strict';
    _uf.ui = _uf.ui || {};
    _uf.ui.layout = {
        init: function () {

            var parser = new UAParser();
            var result = parser.getResult(),
            browserVersion = result.browser.version;

            var attachEvent = document.attachEvent,
                nodes = { header: [], footer: [], content: [] },
                containers = {},
                is_mobile = parser.getOS().name === "iOS" || parser.getOS().name === "Android" || parser.getOS().name === "Windows Phone",
                is_ios = parser.getOS().name === "iOS",
                is_ie = parser.getBrowser().name === "IE",

                method = is_mobile ? "fixed" :
                            (!is_ie || (is_ie && (browserVersion >= 10.0))) ? "flex" :
                            "absolute",

                qs = window.location.search.match(/uf_layout_method=([a-zA-Z]*)/);
            method = (qs ? qs[1] : "") || method;

            _uf.ui.body_scroller = window.document.documentElement;
            _uf.ui.bodyHeight = function () {
                return _uf.ui.body_scroller.clientHeight;
            };

            function groupAllElementsWithAttribute(attribute) {
                for (var node = document.body.firstChild; node; node = node.nextSibling) {
                    if (node.nodeType === 1) {
                        var attributeValue = node.getAttribute(attribute);
                        if (nodes.hasOwnProperty(attributeValue)) {
                            nodes[attributeValue].push(node);
                        }
                        else {
                            if (node.nodeName !== 'SCRIPT') {     //if it is not script tag, by default push to body
                                nodes.content.push(node);
                            }
                        }
                    } else {
                        nodes.content.push(node);
                    }
                }
            }

            function appendMetaTag() {
                var meta = document.createElement('meta');
                meta.name = "viewport";
                meta.content = "width=device-width, user-scalable=no, initial-scale=1";
                var node = (document.head || document.getElementsByTagName("head")[0]).appendChild(meta);
            }

            var requestFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
                                function (fn) { return window.setTimeout(fn, 20); },
                cancelFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;

            function hookUpResize(target_element, mod_node, mod_property) {
                function doResize() {
                    mod_node.style[mod_property] = target_element.clientHeight + "px";
                }
                doResize();
                // Detect size changes by listening for scroll events
                var resize_request, size_detector, resizelast = {};
                function reset_detectors() {
                    var expand = size_detector.firstElementChild,
                        contract = size_detector.lastElementChild,
                        expandChild = expand.firstElementChild;
                    contract.scrollLeft = contract.scrollWidth;
                    contract.scrollTop = contract.scrollHeight;
                    expandChild.style.width = expand.offsetWidth + 1 + 'px';
                    expandChild.style.height = expand.offsetHeight + 1 + 'px';
                    expand.scrollLeft = expand.scrollWidth;
                    expand.scrollTop = expand.scrollHeight;
                }

                function scrollListener(e) {
                    var element = this;
                    reset_detectors();
                    if (resize_request) {
                        cancelFrame(resize_request);
                    }
                    resize_request = requestFrame(function () {
                        if (element.offsetWidth != resizelast.width || element.offsetHeight != resizelast.height) {
                            resizelast.width = element.offsetWidth;
                            resizelast.height = element.offsetHeight;
                            doResize();
                        }
                    });
                }

                if (attachEvent) {
                    target_element.attachEvent('onresize', doResize);
                }
                else {
                    size_detector = document.createElement('div');
                    size_detector.className = '-uf-resize-detector';
                    size_detector.innerHTML = '<div class="-uf-expand-detector"><div></div></div><div class="-uf-contract-detector"></div>';
                    target_element.appendChild(size_detector);
                    reset_detectors();
                    target_element.addEventListener('scroll', scrollListener, true);
                }
            }

            function appendNodes() {
                for (var j = 0; j < arguments.length; j++) {
                    var role = arguments[j],
                        nodelist = nodes[role],
                        elementDiv = document.createElement('div');

                    elementDiv.className = "-uf-" + role + " -uf-" + role + "-" + method;

                    for (var i = 0; i < nodelist.length; i++) {
                        elementDiv.appendChild(nodelist[i]);
                    }

                    document.body.appendChild(elementDiv);
                    containers[role] = elementDiv;
                }
            }

            if (is_mobile) {
                appendMetaTag();
            }

            groupAllElementsWithAttribute('data-uniface-role');

            if (nodes.header.length > 0 || nodes.footer.length > 0) {
                if (method === "fixed") {
                    appendNodes("content", "header", "footer");
                    hookUpResize(containers.header, containers.content, "paddingTop");
                    hookUpResize(containers.footer, containers.content, "paddingBottom");
                }
                else {
                    appendNodes("header", "content", "footer");
                    _uf.ui.body_scroller = containers.content;
                    window.document.documentElement.style.height = "100%";
                }
                if (method === "absolute") {
                    hookUpResize(containers.header, containers.content, "top");
                    hookUpResize(containers.footer, containers.content, "bottom");
                }
                document.body.className += " -uf-body -uf-body-" + method;
            }
            if (method === "fixed" && is_ios) // Workaround for the fact that on iOS 7, with url-bar autohiding, window.clientHeight lies about its size
            {
                if (nodes.footer.length === 0) {
                    appendNodes("footer");
                    containers.footer.style.visibility = "hidden";
                }
                _uf.ui.bodyHeight = function () {
                    return Math.round(containers.footer.getBoundingClientRect().bottom);
                };
            }
        }
    };
}(this._uf));
// %fv: uprops.js-11.1.10:ascii:1 % %dc: Wed Jul 29 14:17:08 2015 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
100811 c28436    950101  tsk Factored out from uluv.js
140627 c30200    100101  Spike Implement the layout with DSP and make sure everything is still functioning correct. #14036
140602 c30088    mx05    tsk Add custom HTML properties mapping to HTML attributes
date   refnum    version who description
*******************************************************************************/

/*global  _uf document UNIFACE */


(function(){
    var 
    UHTML_DOM_MAP = {
        "html:accesskey" : "accessKey",
        "html:class"     : "className",
        "html:disabled"  : "disabled",
        "html:multiple"  : "multiple",
        "html:readonly"  : "readOnly",
        "html:size"      : "size",
        "html:tabindex"  : "tabIndex",
        "html:title"     : "title",
        "html:rows"      : "rows",
        "html:cols"      : "cols"
    },
    UHTML_FORBIDDEN = { // @c30088
        "id": true,
        "style": true
    },
    USTYLE_DOM_MAP = { // UNIFACE style-related logic property to css style property
        backcolor : "backgroundColor",
        forecolor : "color",
        //fontname  : "fontFamily",
        //fontsize  : "fontSize",
        //size      : "width",
            
        "style:background"           : "background",
        "style:background-attachment": "backgroundAttachment",
        "style:background-color"     : "backgroundColor",
        "style:background-image"     : "backgroundImage",
        "style:background-repeat"    : "backgroundRepeat",
        "style:border"               : "border",
        "style:border-bottom"        : "borderBottom",
        "style:border-bottom-color"  : "borderBottomColor",
        "style:border-bottom-style"  : "borderBottomStyle",
        "style:border-bottom-width"  : "borderBottomWidth",
        "style:border-collapse"      : "borderCollapse",
        "style:border-color"         : "borderColor",
        "style:border-left"          : "borderLeft",
        "style:border-left-color"    : "borderLeftColor",
        "style:border-left-style"    : "borderLeftStyle",
        "style:border-left-width"    : "borderLeftWidth",
        "style:border-right"         : "borderRight",
        "style:border-right-color"   : "borderRightColor",
        "style:border-right-style"   : "borderRightStyle",
        "style:border-right-width"   : "borderRightWidth",
        "style:border-style"         : "borderStyle",
        "style:border-top"           : "borderTop",
        "style:border-top-color"     : "borderTopColor",
        "style:border-top-style"     : "borderTopStyle",
        "style:border-top-width"     : "borderTopWidth",
        "style:border-width"         : "borderWidth",
        "style:bottom"               : "bottom",
        "style:clear"                : "clear",
        "style:color"                : "color",
        //"style:csstext"              : "cssText",
        "style:cursor"               : "cursor",
        "style:direction"            : "direction",
        "style:display"              : "display",
        "style:float"                : "float",
        "style:font"                 : "font",
        "style:font-family"          : "fontFamily",
        "style:font-size"            : "fontSize",
        "style:font-style"           : "fontStyle",
        "style:font-variant"         : "fontVariant",
        "style:font-weight"          : "fontWeight",
        "style:height"               : "height",
        "style:left"                 : "left",
        "style:letter-spacing"       : "letterSpacing",
        "style:line-height"          : "lineHeight",
        "style:list-style-image"     : "listStyleImage",
        "style:list-style-position"  : "listStylePosition",
        "style:list-style-type"      : "listStyleType",
        "style:margin"               : "margin",
        "style:margin-bottom"        : "marginBottom",
        "style:margin-left"          : "marginLeft",
        "style:margin-right"         : "marginRight",
        "style:margin-top"           : "marginTop",
        "style:max-height"           : "maxHeight",
        "style:max-width"            : "maxWidth",
        "style:min-height"           : "minHeight",
        "style:min-width"            : "minWidth",
        "style:overflow"             : "overflow",
        //"style:overflow-x"           : "overflowX",
        //"style:overflow-y"           : "overflowY",
        "style:padding"              : "padding",
        "style:padding-bottom"       : "paddingBottom",
        "style:padding-left"         : "paddingLeft",
        "style:padding-right"        : "paddingRight",
        "style:padding-top"          : "paddingTop",
        //"style:page-break-after"     : "pageBreakAfter",
        //"style:page-break-before"    : "pageBreakBefore",
        "style:position"             : "position",
        "style:right"                : "right",
        "style:table-layout"         : "tableLayout",
        "style:text-align"           : "textAlign",
        "style:text-decoration"      : "textDecoration",
        "style:text-indent"          : "textIndent",
        "style:text-transform"       : "textTransform",
        "style:top"                  : "top",
        "style:unicode-bidi"         : "unicodeBidi",
        "style:vertical-align"       : "verticalAlign",
        "style:visibility"           : "visibility",
        "style:white-space"          : "whiteSpace",
        "style:width"                : "width",
        "style:word-spacing"         : "wordSpacing",
        "style:z-index"              : "zIndex"
    },
    PROPERTY_NOT = "!"; // Constants

    var l_gprop;
    var domUhtmlMap = {};
    for (l_gprop in UHTML_DOM_MAP) if (UHTML_DOM_MAP.hasOwnProperty(l_gprop) && UHTML_DOM_MAP[l_gprop]) {
        domUhtmlMap[UHTML_DOM_MAP[l_gprop]] = l_gprop;
    }
    var domUstyleMap = {};
    for (l_gprop in USTYLE_DOM_MAP) if (USTYLE_DOM_MAP.hasOwnProperty(l_gprop)){
        domUstyleMap[USTYLE_DOM_MAP[l_gprop]] = l_gprop;
    }
    
    function copyProps(a_dest, a_src)
    {
        var vProp;  
        
        for (vProp in a_src) if (a_src.hasOwnProperty(vProp )) 
        {
            a_dest[vProp] = a_src[vProp];
        }
               
    }
    
    function initProps()
    {
        this.preStyle = {};
        this.html = {};
        this.att = {}; // @c30088 catergory for custom HTML properties
        this.uniface = {};
        this.className = {};
        this.syntax = {};
    }
    
    function getStyleProperty(propName) {
        return USTYLE_DOM_MAP[propName];
    }
    
    function getHtmlProperty(propName) {
        return UHTML_DOM_MAP[propName];
    }
        
    function isAttributeDefined(node, attrName, attr) {
        
        // Workaround for ie8
        var ie = _uf.ieVersion();

        if ((ie !== undefined) && (ie <= 8)) {
            return attr.specified;
        } else if (node.hasAttribute) {
            return node.hasAttribute(attrName);
        } else {
            return attr.specified;
        }
    }   
     
    function getPList(aStyle) {
        var i,l,vPnvList = aStyle.cssText.split(/; +/),
            vPnList = [];
        for (i=0, l=vPnvList.length; i<l; i++) {
            vPnList.push(vPnvList[i].split(":")[0].toLowerCase());
        }
        return vPnList;
    }    
    
    function initByStyle(aStyle) {
        var vPnList = getPList(aStyle), i,l;
        this.preStyle = {};
        for (i=0, l=vPnList.length; i<l; i++) {
            var vProp = getStyleProperty("style:" + vPnList[i]);
            if (vProp) {
                this.preStyle[vProp] = aStyle[vProp];
            }
        }
    }
    
    function checkAttributeName(a_att)
    {
        try
        {
            document.createAttribute(a_att);
        }
        catch (e) {
            return false;
        }
        return true;
    }

    function getPropSet(a_prop)
    {
        var l_lowercaseProp = a_prop.toLowerCase(), // normalize to lowercase
             l_normProp = getStyleProperty(l_lowercaseProp);
        if ( l_normProp != null ) { // style-related prop.   pragma(allow-loose-compare)
            return { set: this.preStyle, name: l_normProp };  // add to list
        } else if ((l_normProp = getHtmlProperty(l_lowercaseProp)) !== undefined) {  // html prop
            return { set: this.html, name: l_normProp };
        } else if ((l_normProp = a_prop.match(/^\s*html:([^\t\n\f \/>"'=]+)\s*/i)) && !UHTML_FORBIDDEN.hasOwnProperty(l_normProp[1]) && !l_normProp[1].match(/^on/i) && checkAttributeName(l_normProp[1])) {
            // Syntactically valid attribute names minus event handlers (onSomething) and forbidden attibutes @c30088

            return { set: this.att, name: l_normProp[1] };
        } else if ((l_normProp = a_prop.match(/^\s*class:(\S*)\s*/i))) {
            return { set: this.className, name: l_normProp[1] };
        } else { // normal (uniface) prop
            return { set: this.uniface, name: l_lowercaseProp };
        }
    }

    function overlayClasses()
    {
        var l_prop, i,
            l_classes = this.html.className ? UNIFACE.splitString(this.html.className, /\s+/) : [];
        this.classes = {};

        for (i = 0; i < l_classes.length; ++i) {
            this.classes[l_classes[i]] = true;
        }

        for (l_prop in this.className) if (this.className.hasOwnProperty(l_prop))
        {
            this.classes[l_prop] = /^(on|yes|y|true|t|1)$/i.test(this.className[l_prop]);
        }
    }

    _uf.ui = _uf.ui || {};       //@c30200

    UNIFACE.extend.call(_uf.ui, {
        getPropsFromDomNode : function(domNode) {
            // There must be a domNode to get properties from.
            if ( !domNode ) {
                return;
            }
            
            var props = new _uf.ui.Props();
            // Get the style properties from the domNode.
            if ( domNode.style && domNode.style.cssText !== "") {
                initByStyle.call(props, domNode.style);
            }
            // for supporting old size property
            // Commented out since the 'false' clause in the statement below was causing a warning in the build
            // about unreachable code.
            //if ( false && domNode.size > 0 && !isNaN(domNode.size) ) { // pragma(allow-loose-compare)
            //    props.preStyle = "width: " + domNode.size + "em";
            //}
            // Get the U_display property.
            if ( domNode.U_display != null ) { // pragma(allow-loose-compare)
                props.preStyle.display = domNode.U_display;
            }
            
            // Get the other properties, assuming they are HTML properties.
            var attrs = domNode.attributes,
                attr,
                i;
            for (i = attrs.length - 1; i >= 0; i = i-1) {
                attr = attrs[i];
                var nodeName = attr.name;
                     
                var attrName = UHTML_DOM_MAP["html:" + nodeName];
                if (nodeName === "tabindex") {
                    nodeName = "tabIndex";
                }
                if (isAttributeDefined(domNode, nodeName, attr)) {
                    if (attrName) {
                        // Get the value of the attribute using domNode[attrName],
                        // not using attr.nodeValue.
                        // Reason for this is that the value will be used later on
                        // for assignments of this kind: element[attrName] = value.
                        // As an example, found under IE8:
                        // the HTML attribute "multiple" of the <select> tag has
                        // an attr.nodeValue of "multiple", while node[attrName] = "true".
                        props.html[attrName] = domNode[attrName].toString();
                    }
                    else if (!UHTML_FORBIDDEN.hasOwnProperty(nodeName) && !nodeName.match(/^on/)) { // custom @c30088
                        props.att[nodeName.toLowerCase()] = attr.value;
                    }
                }
            }
            return props;
        },
        // Constructor of the Props object
        Props : function(a_props, a_syntax)
        {
            initProps.call(this);

            
            if ( typeof a_props !== "object" ) {
                return;
            }
            
            this.merge(a_props, a_syntax);
        },
        getStyleProperty : getStyleProperty,
        getHtmlProperty: getHtmlProperty
    });
    
    _uf.ui.Props.prototype = {
        /* 
        Merge Uniface-defined classes with classes that may have been added to the element through other means (for instance by the widget)
        
        To allow the function to determine which classes were put there by Uniface (and may need to be removed) and which were added by some other functionality or framework,
        and need to be left alone, we pass in the classes as they currently are on the element, and the classes that were *Previously* added by Uniface;
        Based on that, we remove from the current class string the classes added previously by uniface, then re-add the classes that uniface currently knows about.
        That way, any other classes are untouched.

        We then return the new class string.
        */
        mergeClasses : function(classString, prevClasses)
        {
            if (this.classes === prevClasses)
            {
                return classString;
            }
            else
            {
                var l_prop, i,
                    l_classes = classString ? UNIFACE.splitString(classString, /\s+/) : [],
                    l_classNames = {},
                    l_ret = "";

                for (i = 0; i < l_classes.length; ++i) {
                    l_classNames[l_classes[i]] = true;
                }
                for (l_prop in prevClasses) if (prevClasses.hasOwnProperty(l_prop) && prevClasses[l_prop]) {
                    delete l_classNames[l_prop];
                }

                for (l_prop in this.classes) if (this.classes.hasOwnProperty(l_prop)) {
                    if (this.classes[l_prop])
                    {
                        l_classNames[l_prop] = true;
                    }
                    else{
                        delete l_classNames[l_prop];
                    }
                }

                return Object.keys(l_classNames).join(' ');
            }
        }, 
        merge : function(props, a_syntax) {
            var l_prop, l_value, l_set;
                
            // Adding newdata to list, or deleting prop if it starts with '!';
                
            // reset all first
            if ( props && props.hasOwnProperty(PROPERTY_NOT) ) {
                initProps.call(this);
            }
            
            for ( l_prop in props) if (props.hasOwnProperty(l_prop))
            {
                if ( l_prop.substring(0,1) !== PROPERTY_NOT ) {
                    l_value = props[l_prop].toString ? props[l_prop].toString() : props[l_prop] ;
                    l_set =  getPropSet.call(this, l_prop);
                    l_set.set[l_set.name] = l_value;
                } else if ( l_prop.length > 1 ) {
                    l_set =  getPropSet.call(this, l_prop.substring(1));
                    delete l_set.set[l_set.name];
                }
            }
           
            if (a_syntax)
            {
                this.syntax = {};
                copyProps(this.syntax, a_syntax);
                
                if ( this.html.disabled === "true" ) {
                    this.syntax.DIM = true;
                } else if ( this.html.disabled === "false" ) {
                    this.syntax.DIM = undefined;
                }
               if ( this.html.readOnly === "true" ) {
                    this.syntax.NED = true;
                } else if ( this.html.readOnly === "false" ) {
                    this.syntax.NED = undefined;
                }
            }
        },

        overlayWith : function(otherProps) {
            if ( otherProps == null ) { // pragma(allow-loose-compare)
                return;
            }
            
            copyProps(this.preStyle, otherProps.preStyle);
            copyProps(this.html, otherProps.html);
            copyProps(this.att, otherProps.att); // @c30088
            copyProps(this.uniface, otherProps.uniface);
            copyProps(this.syntax, otherProps.syntax    );
            copyProps(this.className, otherProps.className);

            overlayClasses.apply(this);
        },
        get : function(a_prop)
        {
             var l_set = getPropSet.call(this, a_prop);
             return l_set.set[l_set.name];                    
        },
        getRawProps : function() {
            var rawProps = {};
            var p;
            for (p in this.preStyle) if (this.preStyle.hasOwnProperty(p)) {
                rawProps[domUstyleMap[p]] = this.preStyle[p];
            }
            for (p in this.html) if (this.html.hasOwnProperty(p)) {
                rawProps[domUhtmlMap[p]] = this.html[p];
            }
            for (p in this.att) if (this.att.hasOwnProperty(p)) { // @c30088
                rawProps["html:" + p] = this.att[p]; 
            }
            for (p in this.uniface) if (this.uniface.hasOwnProperty(p)) {
                rawProps[p] = this.uniface[p];
            }
            for (p in this.className) if (this.className.hasOwnProperty(p)) {
                rawProps["class:" + p] = this.className[p];
            }
            return rawProps;
        }
    };
    
})();
// %fv: uluv.js-226.1.4:ascii:1 % %dc: Tue Aug 18 12:20:26 2015 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
080411 c26508    9.ajax  tsk mashup enablement
080508 c26571    9.ajax  mzu add more API function for unit test
080509 c26483    9.ajax  mzu change the widget style property handling
080611 c26693    9.ajax  mzu Reduce using of getElementById
090205 c27248    9.ajax  jdk acceskeys do not work & labels etc show the %sign
090227 c27325    9401c1  fd  Introduce occurrence pool and occurrence map. See entityadmin.
090401 c27358    9401c1  fd  RIA: Use field IDs rather than names in the JSON stream.
090424 c27369    9401c1  mzu RIA: Extends the id with DSP component name.
090528 c27361    9401c1  mzu RIA: Enhance for DSP mashup.
090724 c27513    9401c1  jdk RIA: If instname.length != compname.lenght...crash.Use instname for key.
100824 c28434    950101  mzu OnEdit trigger with new callback API
101027 t99504    950101  jnz RIA: API getInstance
101124 b28956    950101  pdk No syntax checking should take place without user interaction.
110204 c28613    9501c1  jnz RIA: Properies of fields not available to JS API
121219 c29600    100101  ago JS Runtime: handle operation call on instance operation in HTML
                         Form-specific Notify function ulocal.js
130213 c29642    100101  ago HtmlForms/DSP: Make 'main' instance JS API object easily accessible
131007 c29779    100101  ago Uniface Backend is not synchronized after setValue
140319 c30027    100101  ppl Create entity's extended trigger onSelectionChange
140627 c30200    100101  Spike Implement the layout with DSP and make sure everything is still functioning correct. #14036
* date   refnum    version who description
*******************************************************************************/

/*global Promise _uf UNIFACE uniface document */
/// <reference path="ubase.js" />
/// <reference path="uprops.js" />
/// <reference path="udata.js" />
/// <reference path="ureq.js" />
/// <reference path="usyntax.js" />

UNIFACE.assert = function(condition, message) {
    if (!condition) {
        UNIFACE.throwException("INTERNAL ERROR: " + message);
    }
};
///////////////////////////////////////////////////////////////////////////////
// UNIFACE.luv.constants
///////////////////////////////////////////////////////////////////////////////

var UENTITY_PREFIX = "uent:",
    UFIELD_PREFIX = "ufld:",
    ULABEL_PREFIX = "ulbl:",
	UERRORLABEL_PREFIX = "uflderror:";


UNIFACE.namespace("luv.constants").extend(
{
    UINS_SEPARATOR : ":",
    UOCCIND_SEPARATOR : "."
});

/**
 * The UNIFACE.luv namespace
 *
 * @namespace
 */
UNIFACE.luv = UNIFACE.luv || {};

UNIFACE.luv.vsn = "9.7/1";

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.luv.util
///////////////////////////////////////////////////////////////////////////////

UNIFACE.namespace("luv.util").extend(
function() {
    var ULIST_SEPARATOR="\u001B",
        ULIST_SUBSEPARATOR="\u0015";

    /**
     * Removes the image references from the REP with the form "img!rep" for Uniface ValRep
     */
    function _normalizeRep(rep) {
        var i = rep.indexOf(ULIST_SUBSEPARATOR);
        if (i >= 0) {
            rep = rep.substr(i+1);
        }
        return rep;
    }

    return /** @memberOf UNIFACE.luv */{
        uListToArray : function(aUList) {
            if (aUList==="") {
                return [];
            }
            return aUList.split(ULIST_SEPARATOR);
        },

        arrayToUList : function(aArray) {
            return aArray.join(ULIST_SEPARATOR);
        },

        // Normalize ValRep from JSON to runtime format
        normalizeValrep : function(valrep) {
            if ( !valrep || valrep.constructor !== Array ) {
                UNIFACE.throwException(new Error("ValRep format is incorrect!"));
            }
            if ( valrep.length === 0 || valrep[0].constructor===Array ) {
                // if not yet normalized
                var _valrep = [{}, []];
                var i;
                for (i=0; i<valrep.length; i++) {
                    var val = valrep[i][0];
                    _valrep[0][val] = _normalizeRep(valrep[i][1]);
                    _valrep[1][i] = val;
                }
                valrep = _valrep;
            }
            return valrep;
        },

        // If a given valrep has no items this function returns a valrep with
        // an empty value and empty representation.
        // Otherwise it returns the given valrep.
        assureValrep : function(valrep) {
            return ((valrep[1].length > 0) ? valrep : [{ "" : "" }, [""]]);
        },

        isEmptyObject : function(object) {
            var prop;
            for (prop in object) if (object.hasOwnProperty(prop)) {
                return false;
            }
            return true;
        }
    };
}());

/**
 * //TODOC
 *
 * @param {String} a_prefix Used to determine the ID of the element to find
 * @param {Object} a_def
 * @param {String} a_def.nm Used to determine the ID of the element to find
 * @param {UNIFACE.luv.occurrence} a_occ The UNIFACE.luv.occurrence instance
 *      that made the call to realize*()
 * @returns {{el: (HTMLElement|*), contOcc: *, id: String}}
 */
function findPlaceholder (a_prefix, a_def, a_occ) {
    // Look up the placeholder in the nodemap.
    var containingOcc,
        l_instance = a_occ.instance,
        vName = a_prefix + a_def.nm,
        l_el = _uf.DOMNodeManager.fetch(vName, l_instance.instanceName);

    if (l_el) {
        // Found the field node's placeholder in the nodemap.
        // Now find the occurrence that contains it.
        // Generally that is a_occ, but not necessarily.
        var occ = a_occ;
        while (containingOcc === undefined && occ.nodes.length > 0) {
            if (occ.containsNode(l_el)) {
                containingOcc = occ;
                break;
            }
            if (!occ.entity || !occ.entity.occ) {
                break;
            }
            occ = occ.entity.occ;
        }
        var vSuffix = (containingOcc !== undefined ? containingOcc.postfix : a_occ.postfix);
        _uf.DOMNodeManager.add(vName, l_instance.instanceName, null);
        l_el.id = vName + UNIFACE.luv.constants.UINS_SEPARATOR + l_instance.instanceName + vSuffix;
        _uf.DOMNodeManager.add(vName + vSuffix, l_instance.instanceName, l_el);
    }
    return {el: l_el, contOcc: containingOcc, id: vName};
}


(function (_luv, _uf, _uf_cmd, _uf_ui) {

    /**
     * //TODOC
     *
     * @memberof UNIFACE.luv
     *
     * @param {UNIFACE.luv.occurrence} a_occ The UNIFACE.luv.occurrence
     *      instance that is calling this method
     * @param {*} a_name
     * @param {*} a_occ_def
     * @param {*} a_def
     * @param {*} a_data
     * @param {*} a_force
     * @returns {void}
     */
	_luv.realizeField = function (a_occ, a_occ_def, a_name, a_def, a_data, a_force) {

        if (!a_force && a_data.dirty !== undefined && !a_data.dirty) {
            return;
        }
        if (!a_def.triggers) {
            a_def.triggers = {};
        }

        var l_field = a_occ.getChild(a_name);
        if (!l_field) {
            // Look up the placeholder in the nodemap.
            var l_plh = findPlaceholder(UFIELD_PREFIX, a_def, a_occ);

            if (l_plh.el) {
                l_field = new _luv.field(l_plh.el ? l_plh.el.id : l_plh.id, a_occ, a_name, a_def);

                if (a_occ == l_plh.contOcc) {
                    // A proper child of the occurrence.
                    a_occ.children[a_name] = l_field;
                } else {
                    // A foster child for a_occ's entity.
                    a_occ.entity.fosterChildren[a_name] = l_field;
                }

                l_field.widget = UNIFACE.widgetFactory.create(a_def.widget);
                l_field.widget.callBack = l_field.createCallBack();

                l_field.createEvents(["onchange", "onedit"]);
                // Get declarative properties
                if (!a_def.declaredProps) {
                    // Get the widget default properties
                    a_def.declaredProps = new _uf_ui.Props(a_def.properties, a_def.syntax ? a_def.syntax : {});

                    // Merge with the properties from the field's DOM node.
                    a_def.declaredProps.overlayWith(_uf_ui.getPropsFromDomNode(l_plh.el));
                }
				
				var l_name = a_occ_def[a_name].nm;
                if (!l_name) {
                    l_name = a_name;
                }
                if (a_def.label) {
                    // Realize the label that is associated with the field.
                    a_data.label_r_o = _luv.realizeLabel(a_occ, l_name, a_def.label, a_data, a_force);
                }

                // Realize an associated error label (if one is present)
                l_field.errorLabel = _luv.realizeErrorLabel(a_occ, l_name);

                l_field.allProperties(a_def, a_data);
                l_field.widget.render(l_plh.el);
                l_field.postRealize(); // only postRealize for fields on the layout
            } else {
                //field not in the layout, or no widget
                _uf.data.field.getNormalizedProps(a_data);
            }
        } else {
            l_field.allProperties(a_def, a_data);
            l_field.postRealize(); // only postRealize for fields on the layout
        }
		return l_field;
    };

	/**
     * //TODOC
     *
     * @param {*} a_occ
     * @param {*} a_name
     */
	_luv.realizeErrorLabel = function (a_occ, a_name) {
        var lErrorLabelName = UERRORLABEL_PREFIX + a_name,
			l_instance = a_occ.instance,
			l_el = _uf.DOMNodeManager.fetch(lErrorLabelName, l_instance.instanceName);
        if (l_el) {
          l_el.id = lErrorLabelName + _luv.constants.UINS_SEPARATOR + a_occ.instance.instanceName + a_occ.postfix;

        }
        return l_el;
    };

    /**
     * //TODOC
     *
     * @memberof UNIFACE.luv
     * @param {*} a_occ
     * @param {*} a_name
     * @param {*} a_lblDef
     * @returns {void}
     */
    _luv.realizeLabel = function (a_occ, a_name, a_lblDef, a_ido) {
        var l_lblName = ULABEL_PREFIX + a_name;
        var l_label = null;
        var l_instance = a_occ.instance;
		var fieldHasUniqueLabel = false;
        if (!a_lblDef.triggers) {
            a_lblDef.triggers = {};
        }
        l_label = a_occ.children[l_lblName];
        if (!l_label) {
            // Get the default label widget (without occurrence postfix).
            var l_el = _uf.DOMNodeManager.fetch(l_lblName, l_instance.instanceName);
            if (l_el) {
                // Assign the id (including occurrence postfix) to the label widget.
                _uf.DOMNodeManager.add(l_lblName, l_instance.instanceName, null);
                l_el.id = l_lblName + _luv.constants.UINS_SEPARATOR + l_instance.instanceName + a_occ.postfix;
                _uf.DOMNodeManager.add(l_lblName + a_occ.postfix, l_instance.instanceName, l_el);

                // Create the actual label.
                l_label = new _luv.label(l_el.id, a_name, a_lblDef, a_occ.postfix);
                // Administrate it as a child of a_occ.
                a_occ.children[l_lblName] = l_label;
                // Finally render the label.
                if (l_label.widget) {
                    //Support for the accesskey depends on the widget implementation
                    fieldHasUniqueLabel = ((a_ido !== undefined) && (a_ido.hasOwnProperty('labelValue')) && (a_ido.labelValue !== ''));

                    if (fieldHasUniqueLabel) {
                        l_label.widget.setValue(a_ido.labelValue);
                    } else {
                        l_label.widget.setValue(a_lblDef.value);
                    }
                    l_label.widget.render(l_el);
                }
            }
        }
		return l_label;
    };

    /**
     * //TODOC
     *
     * @memberod UNIFACE.luv
     * @param {*} a_entity
     * @param {*} a_occData
     * @param {*} a_index
     * @returns {*}
     */
    _luv.realizeOccurrence = function (a_entity, a_occData, a_index) {
        if (a_index > 0 && a_entity.hasNoPlaceholders) {
            return null;
        }

        var forceRealization = false;
        var occ = a_occData.ro;

        if (!occ || occ.entity !== a_entity) {
            // Create a new occurrence.
            occ = a_entity.instance.getNewOccurrence(a_entity, a_occData, a_index);
            // Make sure it gets realized.
            forceRealization = true;
        }

        // Register the occurrence in the occurrence administration.
        occ.moveTo(a_entity, a_index);
        occ.realize(a_occData, forceRealization);

        return occ;
    };

    /**
     * // TODOC
     *
     * @memberof UNIFACE.luv
     *
     * @param {UNIFACE.luv.occurrence} a_occ The UNIFACE.luv.occurrence
     *      instance that is calling this method
     * @param {*} a_name
     * @param {*} a_def
     * @param {*} entityData
     * @returns {void}
     */
    _luv.realizeEntity = function (a_occ, a_name, a_def, entityData) {
        var l_entity = a_occ.getChild(a_name),
            l_element;

        if (!l_entity) {
            // Look up the placeholder in the nodemap.
            var l_plh = findPlaceholder(UENTITY_PREFIX, a_def, a_occ);

            l_entity = new _luv.entity(a_occ, a_name, a_def);
            l_entity.fieldId = l_plh.el ? l_plh.el.id : l_plh.id;

            if (l_plh.el && a_def.widget) {
                l_element = l_plh.el;
                if (!l_plh.contOcc || a_occ == l_plh.contOcc) {
                    // A proper child of the occurrence.
                    a_occ.children[a_name] = l_entity;
                } else {
                    // A foster child for a_occ's entity.
                    a_occ.entity.fosterChildren[a_name] = l_entity;
                }

                l_entity.widget = UNIFACE.widgetFactory.create(a_def.widget);
                l_entity.widget.callBack = l_entity.createCallBack();
                l_entity.createEvents([]);
                // Get declarative properties
                if (!a_def.declaredProps) {
                    // Get the widget default properties
                    a_def.declaredProps = new _uf_ui.Props(a_def.properties, {});

                    // Merge with the properties from the entities's DOM node.
                    a_def.declaredProps.overlayWith(_uf_ui.getPropsFromDomNode(l_plh.el));
                }
            }
        }

        l_entity.allProperties(a_def, entityData);
        if (l_element) {
            l_entity.widget.render(l_element);
        }

        l_entity.realize(entityData);
    };

    _uf_cmd.on("formtitle", function(data){
        var l_cptName, l_component;
        for (l_cptName in data) if (data.hasOwnProperty(l_cptName)) {
            l_component = _uf.InstanceManager.makeInstance(l_cptName);
            if (l_component) {
                l_component.setTitle(data[l_cptName]);
            }
        }
    });

    _uf_cmd.on("instance", function(data){
        var l_instName, l_data, l_component, l_cptName;

        for (l_instName in data) if (data.hasOwnProperty(l_instName)) {
            if (typeof data[l_instName] === "object") {
                l_data = data[l_instName];
                if (typeof l_data.componentname === "string") {
                    l_cptName = l_data.componentname;
                } else {
                    l_cptName = l_instName;
                }
                l_component = _uf.InstanceManager.makeInstance(l_instName, l_cptName);
                l_component.define(l_data);
            }
        }
    }
    );

    _uf_cmd.on("weboperation", function(data){
        var l_args,
            l_component = _uf.InstanceManager.getInstance(data.instancename);
        if (l_component) {
            l_args = [l_component, data.operationName.toLowerCase(), (data.params ? data.params : {})];
            if (data.args) {
                // Note: this relies on this.args being an Array!
                l_args = l_args.concat(data.args);
            }
            return UNIFACE.dl.postOperation.apply(UNIFACE.dl, l_args);
        }
        else {
            UNIFACE.extension.popupWindow.showMessage("Instance " + data.instancename + ":\n\"" + data.operationName + "\" is not callable.", "OK", "UNIFACE RIA Exception", 0, 0, "error");
            return Promise.reject(new uniface.NotCallable(data.operationName, "o", data.instancename));
        }
    });

    _uf_cmd.on("layout", function(data){
        // Send layout to appropriate DSP widget
        var l_data, l_inst, l_comp, l_layout, l_targetNode, l_component;
        if (data.hasOwnProperty("instanceName")) {
            _uf.InstanceManager.makeInstance(data.instanceName, data.componentName).setLayout(data.layout, data.bindingPoint);
        }
        else {
            // Backwards compatible
            for (l_data in data) if (data.hasOwnProperty(l_data) && l_data.match(/_I[0-9a-zA_Z]+/)) {
                var d = _uf.data;
                l_data = d.getOcc(d.getOccChild(data[l_data], "#2"), 0);
                l_inst = d.getOccChild(l_data, "#3").value;
                l_comp = d.getOccChild(l_data, "#4").value;
                l_layout = d.getOccChild(l_data, "#5").value;
                l_targetNode = d.getOccChild(l_data, "#6").value;
                l_component = _uf.InstanceManager.makeInstance(l_inst, l_comp);
                l_component.setLayout(l_layout, l_targetNode);

                break;
            }
        }
    });
}



)(UNIFACE.luv, _uf, _uf.commands, _uf.ui);
/*global Promise _uf UNIFACE uniface document */
;(function (_luv, _uf, _uf_cmd, _uf_ui) {

    ///////////////////////////////////////////////////////////////////////////////
    // Entityhandler
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Entityhandler is an entity-specific class for creating
     * occurrences, as well as removing them and keeping them for reuse.
     * @param name Name of the entity that the entityhandler will handle.
     * @param structure Structure of the entity.
     */
    var Entityhandler = function (name, structure) {
        this.name = name;
        this.structure = structure;
        this.spareOccurrences = [];
        this.occCounter = 1;
    };

    /**
     * Moves an occurrence to this entityhandler's pool.
     * @param occ The occurrence to move to the pool.
     */
    Entityhandler.prototype = {
        moveToOccPool: function (occ) {
            occ.visitNodes(function (a_node) {
                a_node.parentNode.removeChild(a_node);
            }, true);
            this.spareOccurrences.push(occ);
        },

        /**
         * Creates a new occurrence for a given entity object and adds it
         * to the end of the entity's occurrence array.
         * @param entity The entity object for which to create a new occurrence.
         * @return The new occurrence.
         */
        createOcc: function (entity) {
            return new _luv.occurrence(entity, this.structure.occs, _luv.constants.UOCCIND_SEPARATOR + this.occCounter++);
        },

        /**
         * Gets a new occurrence for a given entity object, either by reusing
         * an occurrence from the pool or by creating a new one.
         * @param entity The entity for which to create a new occurrence.
         * @param occData The data for the new occurrence.
         * @param a_index The occurrence that is to precede the new one
         *          (null means that the new occurrence should be the first).
         */
        getNewOccurrence: function (entity, occData, a_index) {
            var occ = null,
                isNewOcc = false,
                i;
            if (!entity.placeHolders) {
                if (entity.hasNoPlaceholders === true) {
                    UNIFACE.assert(a_index === 0, "Trying to get a second (or higher) occurrence without repetition");
                    // An earlier search for placeholders had no result.
                    // Therefore it is clear that there is no occurrence repetition
                    // for the entity, which means that the entity's single occurrence
                    // should be reused.
                    if (entity.occs.length > 0) {
                        occ = entity.occs[0];
                    }
                } else {
                    // No real occurrences exist yet for the entity.
                    // Find the default occurrence placeholder(s); they will
                    // be used as the placeholders for the first actual occurrence.
                    occ = this.createOcc(entity);

                    if (typeof entity.findPlaceHolders === "function") {
                        occ.nodes = entity.findPlaceHolders(occ.postfix);
                    }
                    isNewOcc = true;
                }
            } else if (entity.occs.length === 1 && !entity.occs[0].realized) {
                // If the entity has only one occurrence which is not realized,
                // then *that* occurrence can be used.
                // Simply return it.
                occ = entity.occs[0];
            } else {
                // Find an unused occ in the current entity
                var l_occs = entity.occs;
                for (i = 0; i < l_occs.length; i++) {
                    if (l_occs[i].realized && (!l_occs[i].data || !_uf.data.isOccValid(l_occs[i].data) || _uf.data.getOccStatus(l_occs[i].data) === "del")) {
                        occ = l_occs[i];
                        break;
                    }
                }

                if (!occ) {
                    // If there are spare occurrences then use one of those.
                    if (this.spareOccurrences.length > 0) {
                        occ = this.spareOccurrences.pop();
                    } else {
                        // There are no spare occurrences.
                        occ = this.createOcc(entity);
                        // Clone the placeholders to make a new occurrence in the DOM.
                        for (i = 0; i < entity.placeHolders.length; i++) {
                            var l_node = entity.placeHolders[i].cloneNode(true);

                            // if that is not the parking place, parse
                            if (l_node !== _luv.parkingPlace) {
                                _uf.DOMNodeManager.parse(l_node, entity.instance.instanceName);
                            }

                            occ.nodes.push(l_node);
                        }
                        isNewOcc = true;
                    }
                }
            }

            if (occ !== null) {
                if (isNewOcc) {
                    // This is a new occurrence.
                    // Set the IDs of the first and last nodes.
                    if (occ.nodes[0]) {
                        occ.nodes[0].id += occ.postfix;
                    }
                    if (occ.nodes.length > 1) {
                        occ.nodes[occ.nodes.length - 1].id += occ.postfix;
                    }
                }
                // Make sure the occurrence knows its entity.
                occ.entity = entity;
            }
            return occ;
        }

    }; // Entityhandler.prototype


    ///////////////////////////////////////////////////////////////////////////////
    // _luv.entityadmin
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * _luv.entityadmin is a class for the administration of entities and
     * their occurrences.
     */
    var EntityAdmin = function () {

        // The entity handlers, for handling individual entities.
        this.entityHandlers = {};
    };

    /**
     * Returns a name to be used in places where an entity name is required
     * but not available. The returned name should be distinguishable from
     * real entity names.
     * @return A string denoting a pseudo-entity name.
     */
    EntityAdmin.prototype = {
        /**
         * Adds entityhandlers for all entities occurring in a given
         * definition structure.
         * @param structure Entity definition structure (as in the 'webdefinitions'
         *          sense), generally nested.
         */
        addEntityHandlers: function (structure) {
            var name;
            for (name in structure) {
                if (structure.hasOwnProperty(name)) {
                    var item = structure[name];
                    if (typeof item === "object" && item.type === "entity") {
                        this.addEntityHandler(item, name);
                    }
                }
            }
        },

        /**
         * Creates an entityhandler for a named entity.
         * @param name Name of the entity for which to create an entityhandler.
         * @param structure Entity structure (as in the 'webdefinitions' sense),
         *          generally nested.
         */
        addEntityHandler: function (structure, name) {
            name = name || "";
            this.entityHandlers[name] = new Entityhandler(name, structure);
            this.addEntityHandlers(structure.occs);  // Recurse deeper into the structure
        },

        /**
         * Gets a new occurrence for a given entity object, either by reusing
         * an occurrence from the pool or by creating a new one.
         * @param entity The entity for which to get a new occurrence.
         * @param occData The data for the new occurrence.
         * @param a_index The occurrence that is to precede the new one
         *          (null means that the new occurrence should be the first).
         * @return The new occurrence.
         */
        getNewOccurrence: function (entity, occData, a_index) {
            var occ = null;
            var entityName = entity.name || "";
            var entityHandler = this.entityHandlers[entityName];
            if (entityHandler) {
                occ = entityHandler.getNewOccurrence(entity, occData, a_index);
            }
            return occ;
        },

        /**
         * Removes a given occurrence for a given entity object, either by reusing
         * an occurrence from the pool or by creating a new one.
         * @param entity The entity for which to create a new occurrence.
         */
        removeOccurrence: function (occ) {
            // If the occurrence is not the only one in the list of
            // its entity's occurrences then remove it from that list
            // and move it to the occurrence pool.
            var occs = occ.entity.occs;
            if (occs.length > 1) {
                // Find the index of the occurrence in its entity's list of occurrences.
                var i = occ.getIndex();
                // Move the removed occurrence to the entity's occurrence pool.
                var entityHandler = this.entityHandlers[occ.entity.name];
                if (entityHandler) {
                    entityHandler.moveToOccPool(occ);
                }
                // Remove the reference to the removed occurrence
                // from the entity's occurrence list.
                occs.splice(i, 1);
            }
        }

    }; // EntityAdmin.prototype


    ///////////////////////////////////////////////////////////////////////////////
    // _uf.Instance
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * //TODOC
     *
     * @constructor
     * @extends EntityAdmin
     * @name Instance
     * @memberof _uf
     * @param {String} a_name
     * @param {String} aCompName
     */
    _uf.Instance = function (a_name, aCompName) {

        var onUpdateListeners = [];

        this.addOnUpdateListener = function (aListener) {
            onUpdateListeners.push(aListener);
        };

        this.fireOnUpdate = function () {
            var i;
            for (i = 0; i < onUpdateListeners.length; i++) {
                onUpdateListeners[i](this);
            }
        };

        function postProcessDefinitions (defs) {
            function postProcessEntDefinitions (defParent, defs, selectionAllowed) {
                var p, childDef, prop, l_selectionAllowed;
				
				// Client-side only triggers
                // These triggers are set without a scope
                var l_clientSideOnlyTriggers = ['onsyntaxerror'];
				
                for (p in defs) if (defs.hasOwnProperty(p)) {
                    childDef = defs[p];
                    if (childDef.nm) {
                        // Make each definition object aware of its own ID.
                        // It is convenient for definition objects (and data objects)
                        // to know using what ID their parent refers to them.
                        childDef.id = p;
						
						// client side only triggers have no scope, so they do not enter the 'serialize' mechanism in uscope.js
                        for (var l_index=0; l_index < l_clientSideOnlyTriggers.length; l_index++) {
                            var l_name = l_clientSideOnlyTriggers[l_index];
                            if (childDef.triggers && childDef.triggers.hasOwnProperty(l_name)) {
                                childDef.triggers[l_name].input = {};
                                childDef.triggers[l_name].output = {};
                            }
                        }

                        if (childDef.type !== "entity") {
                            // We want defs to have a "shortcut property"
                            // that tells wether it contains NED fields.
                            if (childDef.syntax.NED === true && childDef.hash === undefined) {
                                defParent.hasNEDFields = true;
                                defParent.ownsNEDFields = true;
                            }
                        } else {
                            l_selectionAllowed = selectionAllowed;
                            // If this entity is designated as handling selection,
                            // mark it as such, and prevent deeper entities
                            // from doing the same.
                            if (childDef.properties && childDef.properties.selection && l_selectionAllowed) {
                                prop = childDef.properties.selection.toUpperCase();
                                if (prop === "M" || prop === "MULTI") {
                                    childDef.multiSelect = true;
                                    l_selectionAllowed = false;
                                } else if (prop === "S" || prop === "SINGLE") {
                                    childDef.singleSelect = true;
                                    l_selectionAllowed = false;
                                }
                            }
                            // If this entity is designated as being scrollable,
                            // mark it as such.
                            // Also get its page size.
                            if (childDef.properties && childDef.properties.datascrolling) {
                                prop = childDef.properties.datascrolling.toUpperCase();
                                childDef.useDataScrolling = (prop[0] !== "0" && prop[0] !== "F");
                                prop = childDef.properties.pagesize;
                                childDef.pagesize = parseInt(prop, 10);
                                if (isNaN(prop)) {
                                    childDef.pagesize = 32; // Fallback, default
                                }
                            }
                            if (childDef.triggers && childDef.triggers.nextpage) {
                                // Create scope -- for now, hack it
                                var l_ents = {};
                                l_ents[childDef.id] = {">": true};

                                childDef.triggers.nextpage.input = {"entities": [l_ents]};
                                //childDef.triggers.nextpage.output = [];
                                // TODO: add outer occurrences to input

                                // Create scope -- for now, hack it
                                l_ents = {};
                                l_ents[childDef.id] = {">": true};

                                childDef.triggers.nextpage.output = {"entities": [l_ents]};
                                // TODO: add outer occurrences to output ????

                            }
                            // Recursively post-process the children.
                            postProcessEntDefinitions(childDef, childDef.occs, l_selectionAllowed);
                            // If a child entity contains NED fields then so does this one.
                            if (childDef.hasNEDFields) {
                                defParent.hasNEDFields = true;
                            }
                        }
                    }
                }
            }

            postProcessEntDefinitions(defs, defs, true);
        }

        EntityAdmin.apply(this, arguments);

        this.componentName = aCompName;

        // The following seemingly strangely named attributes allow the component to act
        // as if it were an entity (this one containing one occurrence).
        // The component's real entities are inner-entities of this single occurrence.
        this.instance = this;

        this.occs = [];
        this.operations = [];
        this.postfix = "";

        this.instanceName = a_name;
        this.data = null;
        this.title = "";

        this.setLayout = function (a_layout, a_targetNode) {
            this.layout = a_layout;
            if (a_targetNode == "body") {
                _uf.ui.layout.init();                                // @c30200
                _uf.vp.mainInstance = this;                          // Save main instance in global variable
                this.targetNode = document.body;
            }
            if (this.targetNode === undefined) {
                this.createTargetNode();
                this.targetNode.innerHTML = a_layout;
            }

            // if that is not the parking place, parse
            if (this.targetNode !== _luv.parkingPlace) {
                _uf.DOMNodeManager.parse(this.targetNode, this.instanceName);
            }

            if (this.widget != null && this.widget.setLayout != undefined) /* pragma(allow-loose-compare) */ {
                this.widget.setLayout(this);
            }
            this.render();
        };

        this._pendingCreate = false;
        this.define = function (a_newStructure) {
            this.definition = a_newStructure;

            // Remember the component name.
            if (typeof this.definition.componentname === "string") {
                this.componentName = this.definition.componentname;
            }

            if (this.definition) {
                this._pendingCreate = false;
            }

            // Add an entity handler for the pseudo-entity that this component is.
            this.addEntityHandler({"type": "entity", "occs": this.definition});
            // It may be the case that data was supplied to this component
            // before the data structure was defined (that is: the 'render' function
            // was called before the 'define' function).
            // In that case the render has not been able to do its job completely.
            // Therefore it is called here again (without arguments).
            this.createOperations();
            // Postprocess the definitions.
            postProcessDefinitions(this.definition);
            this.render();
        };

        this.addOperation = function (a_name, a_func) {
            if (this.definition) {
                if (!this.definition.operations) {
                    this.definition.operations = {};
                }
                this.definition.operations[a_name] = {requesttype: "clientside"};
            }
            if (!window._uf_clientside) {
                window._uf_clientside = {};
            }
            var l_operationDefs = window._uf_clientside[this.componentName];
            if (!l_operationDefs) {
                l_operationDefs = {};
                window._uf_clientside[this.componentName] = l_operationDefs;
            }

            l_operationDefs[a_name] = a_func;
        };
        this.render = function (a_occData) {
            // Replace the component's data with the new data.
            if (a_occData) {
                this.data = a_occData;
            }
            if (this.data && this.definition) {
                // Postprocess the tree of data elements.
                // Among other things, create the possibility to traverse upwards
                // in the data hierarchy (that is, from a child to ancestors).
                _uf.data.postProcess(this);
                if (this.targetNode && (this.layout !== undefined)) {
                    // Realize the single occurrence of the 'pseudo-entity' that this component is.
                    _luv.realizeOccurrence(this, this.data, 0);
                    // Make the framework aware of the update.
                    this.fireOnUpdate();
                }
            }

        };
    };

    /**
     * _uf.Instance is a Entityadmin for its entities.
     */
    _uf.Instance.prototype = new EntityAdmin();

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.typeName = "instance";

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.createOperations = function () {
        var i;
        this.definition.operations = this.definition.operations || {};
        /*if (this.definition.triggers && this.definition.triggers.execute && !this.definition.operations.exec)
         {
         this.definition.operations.exec = this.definition.triggers.execute;
         }*/

        for (i in this.definition.operations) if (this.definition.operations.hasOwnProperty(i)) {
            if (_uf.transp.is_callable(this.definition.operations[i].requesttype)) {
                this.operations[i] = UNIFACE.bind(UNIFACE.dl.postOperation, UNIFACE.dl, this, i, {});
            }
        }
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.createTargetNode = function () {
        this.targetNode = document.createElement("span");
        this.targetNode.className = "udsp_default";
        this.hideTargetNode();
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.showTargetNode = function (a_parent) {
        if (this.targetNode.parentNode !== a_parent) {
            a_parent.appendChild(this.targetNode);
        }
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.hideTargetNode = function () {
        if (_luv.parkingPlace === undefined) {
            _luv.parkingPlace = document.createElement("div");
            _luv.parkingPlace.style.display = "none";
            document.body.appendChild(_luv.parkingPlace);
        }
        if (this.targetNode) {
            _luv.parkingPlace.appendChild(this.targetNode);
        }
    };

    /**
     * Returns the structure of this component's realized occurrences.
     * The outermost level is a single occurrence (of the pseudo-entity
     * that this component is).
     *
     * //TODOC: return type
     *
     * @memberof _uf.Instance
     * @return {*} The structure of this component's realized occurrences.
     */
    _uf.Instance.prototype.getStructureMap = function () {
        return this.occs;
    };


    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.setTitle = function (a_title) {
        this.title = a_title;
        var l_el = _uf.DOMNodeManager.fetch("uf:ftitle:" + this.instanceName, this.instanceName);
        if (!l_el) {
            l_el = _uf.DOMNodeManager.fetch("uf:ftitle", this.instanceName);
        }
        if (l_el) {
            l_el.innerHTML = "";
            // TODO: luv.component does not have an `element` property - what is this?
            this.element.appendChild(document.createTextNode(a_title));
        }
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.getName = function () {
        return this.definition.componentname;
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.disposeWidgets = function () {
        if (this.data) {
            var occ = this.data.ro;
            if (occ) {
                occ.removeWidget();
            }
        }
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.isActivatable = function () {
        return (
        !this._pendingDelete && !this.isInvalid &&
        (this.definition || this._pendingCreate));
    };

    /**
     * //TODOC
     *
     * @memberof _uf.Instance
     */
    _uf.Instance.prototype.remove = function () {
        this.disposeWidgets();

        // delete the dom node from packing area
        if (this.targetNode) {
            _luv.parkingPlace.removeChild(this.targetNode);
        }

        this.isInvalid = true;
        // delete the instance from instance table;
        _uf.InstanceManager.remove(this.instanceName);
    };


})(UNIFACE.luv, _uf, _uf.commands, _uf.ui);

(function () {
    var instances = {};

    /**
     * //TODOC
     *
     * @memberof _uf
     * @type {{getInstance: Function, makeInstance: Function, remove: Function, some: Function}}
     */
    _uf.InstanceManager = {
        getInstance: function (a_name) {
            return instances[a_name.toUpperCase()];
        },
        makeInstance: function (a_name, aCompName) {
            a_name = a_name.toUpperCase();
            if (typeof instances[a_name] !== "object") {
                instances[a_name] = new _uf.Instance(a_name, aCompName);
            }
            return instances[a_name];
        },
        remove: function (a_name) {
            delete instances[a_name.toUpperCase()];
        },
        some: function (f, thisObject) {
            for (var a in instances) if (instances.hasOwnProperty(a) && (typeof instances[a] === 'object')) {
                if (f.call(thisObject, instances[a], a, this)) {
                    return true;
                }
            }
            return false;
        }
    };
}());

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/


/*global _uf UNIFACE uniface Promise */
;(function (_luv, _uf, _uf_cmd, _uf_ui) {

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.luv.node
///////////////////////////////////////////////////////////////////////////////

    var DragAndDropTriggers = ["ondragstart", "ondrop", "ondragend"];

    function isElementOfArray (a_array, a_element) {
        // --- WORK AROUND ---
        // We would rather have used the Array's indexOf function,
        // but IE8 does not support that...
        for (var i = 0; i < a_array.length; i++) {
            if (a_array[i] === a_element) {
                return true;
            }
        }
        return false;
    }


    /**
     * The _uf.vp namespace
     *
     * @namespace
     * @memberof _uf
     */
    _uf.vp = {};

    /**
     * //TODOC
     *
     * @constructor
     * @memberof _uf.vp
     */
    _uf.vp.Node = function () {};

    _uf.vp.Node.prototype = /** @lends _uf.vp.Node */ {

        /**
         * //TODOC
         *
         * @returns {*|global.uniface.Occurrence}
         */
        getAPIObject: function () {
            if (!this.data.a_o) {
                this.data.a_o = this.createApiObject();
            }
            return this.data.a_o;
        },

        /**
         * //TODOC
         */
        showBlock: function () {
            if (this.widget) {
                this.data.blockedStyle = this.widget.getBlockedProperties();
                this.mergedProperties.overlayWith(this.data.blockedStyle);

                this.widget.setProperties();
                this.widget.setBlocked(true);
            }
        },

        /**
         * //TODOC
         */
        showUnblock: function () {
            if (this.data && this.data.blockedStyle) {
                delete this.data.blockedStyle;
                this.setProperties();
            }
            if (this.widget) {
                this.widget.setBlocked(false);
            }
        },

        /**
         * //TODOC
         *
         * @param a_def
         * @param a_data
         */
        calcProperties: function (a_def, a_data) {
            this.mergedProperties = new _uf_ui.Props();
            this.mergedProperties.overlayWith(a_def.declaredProps);

            if (a_data) {
                this.mergedProperties.overlayWith(_uf.data[this.typeName].getNormalizedProps(a_data));
                if (a_data.blockedStyle) {
                    this.mergedProperties.overlayWith(a_data.blockedStyle);
                }
            }
        },

        /**
         * //TODOC
         *
         * @param a_data
         */
        link: function (a_data) {
            if (this.data && a_data != this.data) {
                UNIFACE.assert(this.data.ro === this, "data object visible in 2 different realized objects ?");
                this.data.ro = undefined;
            }

            this.data = a_data;
            a_data.ro = this;
        },

        /**
         * //TODOC
         */
        unlink: function () {
            if (this.data) {
                UNIFACE.assert(this.data.ro === this, "data object visible in 2 different realized objects ?");
                this.data.ro = undefined;
            }

            this.data = null;
        },

        /**
         * //TODOC
         *
         * @param a_def
         * @param a_data
         */
        allProperties: function (a_def, a_data) {
            this.calcProperties(a_def, a_data);
            this.link(a_data);
        },

        /**
         * //TODOC
         *
         * @param a_triggerName
         * @param a_ev
         */
        doEvent: function (a_triggerName, a_ev) {
            if (this.events[a_triggerName].post) {
				return this.postEvent(a_triggerName, a_ev, Array.prototype.slice.call(arguments, 2));
            }
            else {
				return this.callEvent(a_triggerName, a_ev, Array.prototype.slice.call(arguments, 2));
            }
        },

        /**
         * //TODOC
         *
         * @param a_triggerName
         * @param a_ev
         * @param a_params
         */
        postEvent: function (a_triggerName, a_ev, a_params) {
            UNIFACE.dl.postTrigger(this, a_triggerName, a_params);
            _uf.commands.run();
        },

        /**
         * //TODOC
         *
         * @param a_triggerName
         * @param a_ev
         * @param a_params
         */
        callEvent: function (a_triggerName, a_ev, a_params) {
            // Events should be ignored while we're processing commands,
            // to avoid a loopback.  So, only call the trigger when we're idle.
            if (!_uf.commands.isProcessing()) {
				return UNIFACE.dl.callTrigger(this, a_triggerName, a_ev, a_params);
            } else {
                return Promise.reject(new Error('Trigger ' + a_triggerName + ' not called .. was already processing.'));
            }
        },

        /**
         * //TODOC
         *
         * @param a_trgName
         * @returns {boolean}
         */
        canCall: function (a_trgName) {
            var l_triggers = this.definition.triggers;
            return l_triggers && l_triggers[a_trgName] && _uf.transp.is_callable(l_triggers[a_trgName].requesttype);
        },

        /**
         * //TODOC
         *
         * @param a_triggerName
         * @param a_onmodified
         */
        bindEvent: function (a_triggerName, a_onmodified) {
            var l_hasTrigger = this.canCall(a_triggerName);
            // If this is an occurrence and were dealing with a drag-and-drop trigger,
            // then look in the entity's triggers (we do not have occurrence-level triggers, yet).
            if (!l_hasTrigger &&
                this.typeName === "occurrence" && this.entity !== this.instance &&
                isElementOfArray(DragAndDropTriggers, a_triggerName)) {
                l_hasTrigger = this.entity.canCall(a_triggerName);
            }
            if (a_onmodified) {
                this.events[a_triggerName] = this.bindOnModified(l_hasTrigger, a_triggerName);
            } else if (l_hasTrigger) {
                this.events[a_triggerName] = UNIFACE.bind(this.doEvent, this, a_triggerName);
            } else {
                return;
            }
            UNIFACE.eventMapper.register(this.fieldId, a_triggerName, this.events[a_triggerName]);
        },

        /**
         * //TODOC
         *
         * @param a_modFunctions
         */
        createEvents: function (a_modFunctions) {

            var i, builtins = {};

            for (i = 0; i < a_modFunctions.length; ++i) {
                builtins[a_modFunctions[i]] = true;
                this.bindEvent(a_modFunctions[i], true);
            }

            var trg;
            var l_triggers = this.definition.triggers;

            for (trg in l_triggers) if (!builtins.hasOwnProperty(trg) && l_triggers.hasOwnProperty(trg)) {
                builtins[trg] = true;
                this.bindEvent(trg, false);
            }

            for (i = 0; i < DragAndDropTriggers.length; i++) {
                trg = DragAndDropTriggers[i];
                if (!builtins.hasOwnProperty(trg)) {
                    this.bindEvent(trg, false);
                }
            }
        },

        /**
         * //TODOC
         */
        setProperties: function () {
            this.setLUVProperties();
            this.setWidgetProperties();
        },

        /**
         * //TODOC
         */
        setLUVProperties: function () {
            this.calcProperties(this.definition, this.data);
        },

        /**
         * //TODOC
         */
        setWidgetProperties: function () {
            if (this.widget) {
                this.widget.setProperties();
            }
        },

        /**
         * //TODOC
         *
         * @returns {nm|*|a_inst.nm}
         */
        getName: function () {
            return this.definition.nm;
        },

        /**
         * //TODOC
         */
        removeWidget: function () {
            if (this.widget) {
                this.widget.dispose();
                this.widget = null;
            }
        }
    };

    ///////////////////////////////////////////////////////////////////////////////
    // UNIFACE.luv.field
    ///////////////////////////////////////////////////////////////////////////////


    /**
     * //TODOC
     *
     * @constructor
     * @name field
     * @memberof UNIFACE.luv
     * @extends _uf.vp.Node
     * @param a_id
     * @param a_occ
     * @param a_name
     * @param a_def
     */
    _luv.field = function (a_id, a_occ, a_name, a_def) {
        if (a_def && a_def.valrep) {
            a_def.valrep = UNIFACE.luv.util.normalizeValrep(a_def.valrep);
        }
        this.occ = a_occ;
        this.instance = a_occ.instance;
        this.definition = a_def;
        this.fieldId = a_id;
        this.valueExt = "";
        this.data = null;
        this.valrep = null;
        this.plainFieldName = a_name;
        this.events = {};

        this.widget = null;
    };

    _luv.field.prototype = new _uf.vp.Node();

    UNIFACE.extend.call(_luv.field.prototype, /** @lends UNIFACE.luv.field */ {

        /**
         * //TODOC
         *
         * @type {String}
         */
        typeName: "field",

        /**
         * //TODOC
         *
         * @param aVal
         * @returns {ExtensiveValue}
         */
        checkedValue: function (aVal) {
			var l_promise;
            var l_v = _uf.data.getFldValue(this.data);
            var l_rv = new UNIFACE.syn.ExtensiveValue(l_v, l_v, this.plainFieldName, this.mergedProperties.syntax, this.valrep);

            if (this.widget) {
                if (aVal === undefined) {
                    aVal = this.widget.getValue();
                }
                if (aVal == null) { // pragma(allow-loose-compare)
                    aVal = "";
                }

                var props;
                if (this.data) {
                    props = _uf.data[this.typeName].getNormalizedProps(this.data);
                } else {
                    props = {};
                }

                // Check if the field's widget approves of the value.
                var errorMsg = this.widget.validate();
                if (errorMsg) {
                    l_rv.error = errorMsg;
                    return l_rv;
                }

                var lSyntax = this.mergedProperties.syntax;
                if (!lSyntax) {
                    lSyntax = {};
                }

                l_rv = UNIFACE.syn.checkField(lSyntax, aVal, l_rv.originalValue, this.valrep, this.plainFieldName);
            }
            return l_rv;
        },

        /**
         * //TODOC
         *
         * @param a_data
         */
        setValue: function (a_data) {
            this.valueExt = UNIFACE.syn.int2ext(this.mergedProperties.syntax, a_data);
            if (this.widget) {
                this.widget.setValue(this.valueExt);
            }
        },

        /**
         * //TODOC
         */
        setNotModified: function () {
            this.modValue = this.widgetValue = this.widget.getValue();
            this.widgetRepresentation = this.widget.getRepresentation();
        },

        /**
         * //TODOC
         *
         * @param valrep
         * @param value
         */
        setValrep: function (valrep, value) {
            if (valrep) {
                this.valrep = _luv.util.assureValrep(valrep);
                this.widget.setValrep(this.valrep);
            }
            if (value !== undefined) {
                this.setValue(value);
            }
        },

        /**
         * //TODOC
         *
         * @param a_def
         * @param a_data
         */
        allProperties: function (a_def, a_data) {
            _uf.vp.Node.prototype.allProperties.call(this, a_def, a_data);

            if (a_data) {
                if (_uf.data.getFldValrep(this.data)) {
                    _uf.data.setFldValrep(this.data, _luv.util.normalizeValrep(_uf.data.getFldValrep(this.data)));
                }
            }

            // Set field value, valrep, and syntax
            var l_valrep = _uf.data.getFldValrep(this.data);
            if (!l_valrep) {
                l_valrep = this.definition.valrep;
            }
            this.setValrep(l_valrep, _uf.data.getFldValue(this.data));

            if (this.widget && _uf.data.getFldResource(this.data) !== undefined && _uf.data.getFldResource(this.data) !== null) {
                this.widget.setResource(_uf.data.getFldResource(this.data));
            }
        },

        /**
         * //TODOC
         *
         * @param a_message
		 * @param a_suppressWidgetMechanism
         */
        showError: function (a_message, a_suppressWidgetMechanism) {
            if (!a_suppressWidgetMechanism) {
                if (typeof (this.widget.showError) === "function") {
                    this.widget.showError(a_message);
                }
            }
            _uf.view.errorFeedback.show(this, a_message);
        },
		
		/**
         * //TODOC
         *
         * @param a_suppressWidgetMechanism
         */
		hideError: function (a_suppressWidgetMechanism) {
            if (!a_suppressWidgetMechanism) {
                if (typeof (this.widget.hideError) === "function") {
                    this.widget.hideError();
                }
            }
            _uf.view.errorFeedback.hide(this);
        },
		
		/**
         * //TODOC
         *
         * @param anErrorObject
         * @param a_suppressSyntaxErrorTrigger
         * @param a_suppressWidgetMechanism
         */
        handleError: function(anErrorObject, a_suppressSyntaxErrorTrigger, a_suppressWidgetMechanism) {
            var _this = this;
            if (this.syntaxCheckEnabled()) {
                if (anErrorObject.error) {
                    if ((this.events.onsyntaxerror) && (!a_suppressSyntaxErrorTrigger)) {

                        // Activate OnSyntaxError webtrigger
                        var l_promise = this.events.onsyntaxerror();
                        
                        l_promise.then(function (a) {
                            // If the JS return value from the OnSyntaxError webtrigger is false,
                            // cancel the error handling.
                            if (a.returnValue !== false) {
                                _this.showError(anErrorObject.error, a_suppressWidgetMechanism);
                            }
                        })['catch'](
                            function (e) {

                                // Need to decide what to do if promise was rejected
                                //console.log('Event promise rejected:');
                                //console.log(e);
                            }
                        );
                    } else {
                        // If no OnSyntaxError webtrigger, just show the error
                        this.showError(anErrorObject.error, a_suppressWidgetMechanism);
                    }
                } else {
                    // If no syntax error, Syntax Check On Browser is disabled, hide the error.
                    this.hideError(a_suppressWidgetMechanism);
                }
            }
        },
		
        /**
         * //TODOC
         */
        unrealize: function () {
            if (this.widget) {
                this.widget.unrender();
            }
            this.unlink();
        },

        /**
         * //TODOC
         *
         * @returns {boolean}
         */
        isModified: function () {
            if (this.widget) {
                return (this.widget.getValue() !== this.widgetValue) || (this.widget.getRepresentation() !== this.widgetRepresentation);
            }
            return false;
        },

        /**
         * //TODOC
         *
         * @returns {{getName: Function, getType: Function, checkValue: Function, getCalculatedProperties: Function, getDefProperty: Function, bind: Function, getEvents: Function, getValue: Function, getValrep: Function, getId: Function, markAsModified: Function, getInstance: Function}}
         */
        createCallBack: function () {
            var field = this;  // Create closure
            return {
                getName: function () {
                    return field.definition.nm;
                },
                getType: function () {
                    return "F";
                },
                checkValue: function (aVal, a_suppressSyntaxErrorTrigger) {
                    if (typeof (field.modValue) == "undefined" ||
                        field.modValue === aVal || (_uf.data.getOccServerStatus(field.occ.data) === "empty" && aVal == field.widgetValue)) {
                        // The field is not modified, so no need to check its value.
                        return {newValue: aVal};
                    }
                    var checkedValue = field.checkedValue(aVal);
                    if (!checkedValue.error) {
                        // The field was successfully checked.
                        // Update the 'modValue', so that next time this checkValue() function
                        // will use *that* in the modification test a few lines above.
                        field.modValue = checkedValue.normalizedValue;
                    }

                    // Suppress the custom widget error. Pass through the OnSyntaxError trigger suppression flag.
                    field.handleError(checkedValue, a_suppressSyntaxErrorTrigger, true);
                    
                    return checkedValue;
                },
                getCalculatedProperties: function () {
                    return field.mergedProperties;
                },
                getDefProperty: function (aPropName) {
                    return field.definition.properties[aPropName];
                },
                bind: function (a_triggerName, a_function) {
                    var f = UNIFACE.bind(a_function, field.widget);
                    UNIFACE.eventMapper.register(field.fieldId, a_triggerName, f);
                    return f;
                },
                getEvents: function () {
                    return field.events;
                },
                getValue: function () {
                    return field.valueExt;
                },
                getValrep: function () {
                    return field.valrep;
                },
                getId: function () {
                    return field.fieldId;
                },
                markAsModified: function () {
                    field.markAsModified();
                },
                getInstance: function () {
                    return field.occ.instance;
                },
				getErrorLabel: function () {
                    return field.getErrorLabel();
                },
                getSyntaxCheckEnabled: function() {
                    return field.syntaxCheckEnabled();
                }
            };
        },
		
        /**
         * //TODOC
         *
         */
		getErrorLabel: function () {
            return this.errorLabel;
        },
		
        /**
         * //TODOC
         *
         * @param a_ev
         * @param a_widgetId
         * @returns {boolean}
         */
        shouldMarkAsModified: function (a_ev, a_widgetId) {
            var srcWidget = a_ev ? (a_ev.target || a_ev.srcElement) : null;
            return !srcWidget || !srcWidget.id || srcWidget.id === a_widgetId;
        },

        /**
         * //TODOC
         */
        markAsModified: function () {
            // Ignore modifications during event processing  or realization of widgets.
            if (_uf.commands.isProcessingServerResponse() || _luv.busyRealizing) {
                return;
            }

            // Mark the field's data as modified.
            _uf.data.setFldMod(this.data);
            // Mark the field's occurrence as directly modified.
            var luvOcc = this.occ;
            _uf.data.setOccMod(luvOcc.data, "direct");
            // Mark the ancestor occurrences as indirectly modified,
            // if they have not already been marked as modified earlier.
            while (luvOcc.entity && luvOcc.entity.occ && !_uf.data.isOccMod(luvOcc.entity.occ.data)) {
                luvOcc = luvOcc.entity.occ;
                _uf.data.setOccMod(luvOcc.data, "indirect");
            }
        },

        /**
         * //TODOC
         *
         * @param a_doTrigger
         * @param a_trg
         * @param a_ev
         * @param a_widgetId
         * @param a_params
         */
        doOnModified: function (a_doTrigger, a_trg, a_ev, a_widgetId, a_params) {
            if (!_luv.busyRealizing && this.shouldMarkAsModified(a_ev, a_widgetId)) {
                this.markAsModified();
                if (this.widget) {
                    _uf.data.setFldValue(this.data, this.widget.getValue());
                }
            }
            if (a_doTrigger) {
                this.doEvent(a_trg, a_ev, a_params);
            }
        },

        /**
         * //TODOC
         *
         * @param a_doTrigger
         * @param a_trg
         * @returns {Function}
         */
        bindOnModified: function (a_doTrigger, a_trg) {
            var l_onMod = UNIFACE.bind(this.doOnModified, this, a_doTrigger, a_trg);

            /*
             The 'this' pointer in the following closure is the original THIS from when the event was fired, NOT the Uniface field object that will be bound.
             Hence the extra layer here.
             */
            return function (a_ev) {
                return l_onMod(a_ev, this.id, Array.prototype.slice.call(arguments, 1));
            };
        },
		
		/**
         * //TODOC
         * The 'Syntax Check on Browser' property (Component Field Property / Widget Type / Uniface Tab) 
		 * can block the syntax error checking on a browser. 
		 * This function returns whether or not it is enabled.
         */
        syntaxCheckEnabled: function() {
            if (typeof this.mergedProperties.uniface.clientsyntaxcheck !== 'string') {
                return true;
            }

            if (this.mergedProperties.uniface.clientsyntaxcheck.match(/^(on|yes|y|true|t|1)$/i)) {
                return true;
            }

            return false;
        },		
		
        /**
         * //TODOC
         */
        postRealize: function () {
            this.widget.setProperties();
			
            if (this.mergedProperties.uniface && this.mergedProperties.uniface.errormsg) {
                this.showError(this.mergedProperties.uniface.errormsg);
            } else {
                this.hideError();
            }

            // Give the widget a chance to 'mangle' the value during 'render'
            // This mangled value is used later to compare against a 'recent' value as presented by the widget.
            this.setNotModified();
        },

        /**
         * Gets the currency for this field, expressed as an array whose elements each
         * specify an entity name and occurrence id.  The first array element identifies
         * the outermost occurrence; subsequent elements "zoom in" on the field.
         *
         * //TODOC: return type
         *
         * @return {*} The currency for this field.
         */
        getCurrency: function () {
            return this.occ.getCurrency();
        },

        /**
         * //TODOC
         *
         * @returns {*}
         */
        createApiObject: function () {
            var occAPIObject = this.occ.getAPIObject();
            return occAPIObject.getField(this.definition.nm);
        }

    }); // _luv.field.prototype


    ///////////////////////////////////////////////////////////////////////////////
    // _luv.label
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * // TODOC
     *
     * @constructor
     * @name label
     * @memberof UNIFACE.luv
     * @param a_id
     * @param a_name
     * @param a_lblDef
     * @param a_occPostFix
     */
    _luv.label = function (a_id, a_name, a_lblDef, a_occPostFix) {
        this.labelId = a_id;
        this.definition = a_lblDef;

        if (a_lblDef.widget) {
            this.widget = UNIFACE.widgetFactory.create(a_lblDef.widget);
            this.widget.callBack = this.createCallBack();
        }
    };

    _luv.label.prototype = /** @lends UNIFACE.luv.label */ {

        /**
         * //TODOC
         *
         * @type {String}
         */
        typeName: "label",

        /**
         * //TODOC
         */
        unrealize: function () {
            if (this.widget) {
                this.widget.unrender();
            }
        },

        /**
         * //TODOC
         *
         * @returns {{checkedValue: _uf.nop, getCalculatedProperties: _uf.nop, getDefProperty: _uf.nop, bind: _uf.nop, getEvents: _uf.nop, getValue: Function, getValrep: _uf.nop, getId: Function, markAsModified: _uf.nop}}
         */
        createCallBack: function () {
            var label = this; // Create closure
            return {
                checkedValue: _uf.nop,
                getCalculatedProperties: _uf.nop,
                getDefProperty: _uf.nop,
                bind: _uf.nop,
                getEvents: _uf.nop,
                getValue: function () {
                    return label.definition.value;
                },
                getValrep: _uf.nop,
                getId: function () {
                    return label.labelId;
                },
                markAsModified: _uf.nop
            };
        },

        /**
         * //TODOC
         */
        removeWidget: function () {
            if (this.widget) {
                this.widget.dispose();
                this.widget = null;
            }
        },

        setValue: function(a_data) {
            if (this.widget) {
                this.widget.setValue(a_data);
            }
        }
		
    }; // _luv.label.prototype


    ///////////////////////////////////////////////////////////////////////////////
    // _luv.occurrence
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * //TODOC
     *
     * @constructor
     * @name occurrence
     * @memberof UNIFACE.luv
     * @extends _uf.vp.Node
     * @param a_entity
     * @param a_occDef
     * @param postfix
     */
    _luv.occurrence = function (a_entity, a_occDef, postfix) {
        this.instance = a_entity.instance;
        this.children = {};
        this.definition = a_occDef;
        this.realized = false;

        /**
         * An Array holding DOMNodes. Get's populated by
         * Entityhandler.getNewOccurrence(), which calls
         * UNIFACE.luv.entity.findPlaceHolders()
         *
         * @type {[HTMLElement]}
         */
        this.nodes = [];
        this.events = {};

        if (a_entity.instance === a_entity) {
            this.entity = null;
            this.postfix = "";
        } else {
            this.entity = a_entity;
            this.postfix = postfix;
        }
    };

    // Selects or deselects a number of occurrences of an entity.
    // Returns true if and only if the selection state of at least
    // one of the occurrences changed.
    function setManyOccsSelection (a_ent, from, to, selection) {
        var selChange = false;
        if (a_ent) {
            var i, allOccs = a_ent.occs;
            if (from < 0) {
                from = 0;
            }
            if (to >= allOccs.length) {
                to = allOccs.length - 1;
            }
            for (i = from; i <= to; i++) {
                // Only really deselect if it was selected (we don't want
                // to create superfluous JavaScript attributes).
                if (selection || allOccs[i][1].isSelected) {
                    selChange = _uf.data.setOccSelection(allOccs[i], selection) || selChange;
                }
            }
        }
        return selChange;
    }

    _luv.occurrence.prototype = new _uf.vp.Node();

    UNIFACE.extend.call(_luv.occurrence.prototype, /** @lends UNIFACE.luv.occurrence */ {

        /**
         * //TODOC
         *
         * @type {String}
         */
        typeName: "occurrence",

        /**
         * //TODOC
         */
        postRealize: function () {
            this.widget.setProperties();
            /*if (this.mergedProperties.uniface && this.mergedProperties.uniface.errormsg)
             {
             this.showError(this.mergedProperties.uniface.errormsg);
             }*/
        },

        /**
         * //TODOC
         *
         * @returns {{getName: Function, getType: Function, getCalculatedProperties: Function, getDefProperty: Function, getEvents: Function}}
         */
        createCallBack: function () {
            var occ = this;  // Create closure
            return {
                getName: function () {
                    return occ.entity.definition.nm;
                },
                getType: function () {
                    return "O";
                },
                getCalculatedProperties: function () {
                    return occ.mergedProperties;
                },
                getDefProperty: function (aPropName) {
                    return occ.entity.definition.properties[aPropName];
                },
                getEvents: function () {
                    return occ.events;
                }
            };
        },

        /**
         * //TODOC
         *
         * @param a_modFunctions
         */
        createEvents: function (a_modFunctions) {
            _uf.vp.Node.prototype.createEvents.call(this, a_modFunctions);

            var occ = this;  // Create closure
            this.events.onselect = function (e) {
                // If there is no event, there is nothing we can do here...
                if (!e) {
                    return;
                }
                // If the event's target is a label that is associated with a control,
                // then ignore it, because that control will receive the same event.
                if (e.target && e.target.nodeName === "LABEL" && e.target.control) {
                    return;
                }
                // Handle selection.
                // Do it before affecting occurrence currency,
                // because shift-select relies on the 'old' current occurrence.
                var selectionChanged = false;
                if (e.button === 0) {            // Left mouse button
                    if (e.ctrlKey) {
                        selectionChanged = occ.ctrlSelect();
                    } else if (e.shiftKey) {
                        selectionChanged = occ.shiftSelect();
                    } else {
                        selectionChanged = occ.select();
                    }
                } else if (e.button == 2) {     // Right mouse button
                    selectionChanged = occ.contextSelect();
                }
                // Make the occurrence current.
                _uf.data.setOccCurrent(occ.data);
                // Mark the event object with an indication whose selection changed.
                e._uniface = e._uniface || {};
                if (selectionChanged) {
                    e._uniface.selectionChanged = occ;
                }
            };

            if (this.entity !== this.instance && this.entity.canCall("onselectionchange")) {
                this.events.onselectionchange = function (e) {
                    // If there is no event, there is nothing we can do here...
                    if (!e) {
                        return;
                    }
                    // If the event's target is a label that is associated with a control,
                    // then ignore it, because that control will receive the same event.
                    if (e.target && e.target.nodeName === "LABEL" && e.target.control) {
                        return;
                    }

                    if (e._uniface && e._uniface.selectionChanged == occ) {
                        // Once HTML Forms have keyboard support, it might be possible
                        // to change selection using the keyboard (e.g. using the arrow
                        // keys while holding the CTRL key down).  This might result
                        // in rapid sequences of firing the "onselectionchange" trigger.
                        // In such circumstances the trigger should rather be called using
                        // UNIFACE.dl.callTriggerWithDelay(occ.entity, "onselectionchange", TRIGGER_DELAY).
                        // This would prevent such rapid trigger sequences.
                        // However: in this situation the selection change resulted from
                        // a mouse click. So, here we can simply immediately fire the trigger.
                        UNIFACE.dl.callTrigger(occ.entity, "onselectionchange");
                    }
                };
            }

            // The implicit occurrence currency and occurrence selection behavior
            // for the "drag" event.
            this.events.ondraginit = function (e) {
                // If there is no event, there is nothing we can do here...
                if (!e) {
                    return;
                }
                // If the event's target is a label that is associated with a control,
                // then ignore it, because that control will receive the same event.
                if (e.target && e.target.nodeName === "LABEL" && e.target.control) {
                    return;
                }
                // Handle implicit selection.
                var selectionChanged = occ.contextSelect();
                // Make the occurrence current.
                _uf.data.setOccCurrent(occ.data);
                // Mark the event object with an indication whose selection changed.
                e._uniface = e._uniface || {};
                if (selectionChanged) {
                    e._uniface.selectionChanged = occ;
                }
            };

            // The implicit occurrence currency and occurrence selection behavior
            // for the "drop" event is the same as for the "drag" event.
            this.events.ondropinit = this.events.ondraginit;
        },

        /**
         * //TODOC
         *
         * @param childName
         * @returns {*}
         */
        getChild: function (childName) {
            var child = this.children[childName];
            // If there is no proper child and this is the first occurrence then
            // the field might be a foster child.
            if (!child && this.entity && !_luv.util.isEmptyObject(this.entity.fosterChildren) && this === this.entity.occs[0]) {
                child = this.entity.fosterChildren[childName];
            }
            if (!child) {
                child = null;
            }
            return child;
        },

        /**
         * //TODOC
         *
         * @returns {Array}
         */
        getCurrency: function () {
            var occ,
                occs = [];
            for (occ = this; occ && occ.entity && occ.entity !== occ.entity.instance; occ = occ.entity.occ) {
                occs.unshift(occ);
            }
            return occs;
        },

        /**
         * //TODOC
         *
         * @returns {string}
         */
        getPathForNewPage: function () {
            var l_currency = this.getCurrency();
            var l_sep = "";
            var l_path = "";
            if (l_currency) {
                for (var i = 0; i < l_currency.length; i++) {
                    if (_uf.data.getOccStatus(l_currency[i].data) !== "empty") {
                        l_path += l_sep + l_currency[i].entity.definition.nm;
                        l_sep = ";";
                        l_path += l_sep + _uf.data.getOccId(l_currency[i].data);
                    }
                }
            }
            return l_path;
        },

        /**
         * //TODOC
         *
         * @returns {nm|*|a_inst.nm}
         */
        getName: function () {
            return this.entity.definition.nm;
        },

        /**
         * //TODOC
         *
         * @param a_def
         * @param a_data
         */
        calcProperties: function (a_def, a_data) {
            _uf.vp.Node.prototype.calcProperties.call(this, a_def, a_data);
            if (a_data && this.widget) {
                var stateProps = this.widget.stateProps;
                if (stateProps) {
                    this.mergedProperties.overlayWith(stateProps.plain);
                    if (_uf.data.isOccEmpty(a_data)) {
                        this.mergedProperties.overlayWith(stateProps.empty);
                    }

                    if (_uf.data.isOccSelected(a_data)) {
                        this.mergedProperties.overlayWith(stateProps.selected);
                    }
                    if (_uf.data.isOccCurrent(a_data)) {
                        this.mergedProperties.overlayWith(stateProps.current);
                    }
                }
            }
        },

        /**
         * Calculates the index of this occurrence in its entity's list of occurrences.
         *
         * @return {Number} Index of this occurrence.
         */
        getIndex: function () {
            // Find the index of the occurrence in its entity's list of occurrences.
            var i, occs = this.entity.occs;
            for (i = 0; i < occs.length; i++) {
                if (this === occs[i]) {
                    return i;
                }
            }
            return -1;
        },

        /**
         * Inserts this occurrence at a given index (requiredIndex).
         * @param {*} entity The entity to which this occurrence belongs,
         *  and in which this occurrence should get the required index
         * @param {Number} requiredIndex The index this occurrence should have
         *  when this function finishes.
         */
        moveTo: function (entity, requiredIndex) {
            var myIndex = this.getIndex();

            if (myIndex !== requiredIndex) {
                if (this.nodes.length > 0 && entity.occs.length > 0) {
                    // Determine the insertion point in the DOM tree,
                    // for use if this occurrence's nodes are to be moved.
                    var insertionPointNode;
                    if (requiredIndex === 0) {
                        // The insertion point is the first node of the first occurrence.
                        insertionPointNode = entity.occs[0].nodes[0];
                    }
                    else {
                        // The insertion point is the node that follows the last node of the preceding occurrence.
                        insertionPointNode = entity.occs[requiredIndex - 1].nodes[this.nodes.length - 1].nextSibling;
                    }

                    // If so required, move the occurrence nodes as well.
                    if (this.nodes[0] !== insertionPointNode) {
                        this.visitNodes(function (a_node) {
                            entity.parentNode.insertBefore(a_node, insertionPointNode);
                        }, true);
                    }
                }

                // Move this occurrence from its current location to
                // the the required location in its entity's occurrence list.
                if (myIndex >= 0) {
                    this.entity.occs.splice(myIndex, 1);
                }
                entity.occs.splice(requiredIndex, 0, this);
            }
        },

        /**
         * Visits all (non-text) nodes that are associated with this occurrence
         * and calls the nodeAction on each of them.
         *
         * @param {Function} nodeAction A callback function that will be called
         *      for each node in this occurrence's node list. The callback will
         *      receive the node reference as only argument
         * @param {Boolean=false} allNodes Whether to call the callback for all
         *      types and not only non-text nodes
         */
        visitNodes: function (nodeAction, allNodes) {
            var i;
            for (i = 0; i < this.nodes.length; i++) {
                var l_node = this.nodes[i];
                UNIFACE.assert(l_node !== null);
                /* pragma(allow-loose-compare) */
                if (allNodes || l_node.nodeType !== 3) {
                    nodeAction(l_node);
                }
            }
        },

        /**
         * Visits all of this occurrence's children (including fosterChildren
         * if it has them), and performs the childAction on each of them.
         * @param {*} childAction Action to apply to the children
         */
        visitAllChildren: function (childAction) {
            this.visitOwnChildren(childAction);
            this.visitFosterChildren(childAction);
        },

        /**
         * //TODOC
         * @param childAction
         */
        visitFosterChildren: function (childAction) {
            if (this.entity && this === this.entity.occs[0] && !_luv.util.isEmptyObject(this.entity.fosterChildren)) {
                var childName,
                    fosterChildren = this.entity.fosterChildren;
                for (childName in fosterChildren) if (fosterChildren.hasOwnProperty(childName)) {
                    childAction(fosterChildren[childName], childName);
                }
            }
        },

        /**
         * Visits this occurrence's own children (so, excluding any fosterChildren)
         * and performs the childAction on each of them.
         * @param childAction Action to apply to the children
         */
        visitOwnChildren: function (childAction) {
            var childName;
            for (childName in this.children) if (this.children.hasOwnProperty(childName)) {
                childAction(this.children[childName], childName);
            }
        },

        /**
         * //TODOC
         */
        makeVisible: function () {
            if (!this.realized) {
                var makeNodeVisible = function (n) {
                    if (n.getAttribute('U_display') != null) { /* pragma(allow-loose-compare) */
                        n.style.display = n.getAttribute('U_display');
                        n.removeAttribute('U_display');
                    }
                };
                this.visitNodes(makeNodeVisible);
                this.realized = true;
            }
            // TODO?
            // At this point we could apply properties to the occurrence nodes,
            // for occurrence coloring.
        },

        /**
         * //TODOC
         */
        makeInvisible: function () {
            if (this.realized) {
                var makeNodeInvisible = function (n) {
                    n.setAttribute('U_display', n.style.display);
                    n.style.display = "none";
                };
                this.visitNodes(makeNodeInvisible);
                this.realized = false;
            }
        },

        /*
         No visualization for blocked occurrences yet.
         */
        /**
         * //TODOC
         */
        showBlock: _uf.nop,

        /*
         No visualization for blocked occurrences yet.
         */
        /**
         * //TODOC
         */
        showUnblock: _uf.nop,

        /**
         * //TODOC
         */
        unrealize: function () {
            this.unlink();
            if (this.realized) {
                this.visitOwnChildren(function (child) {
                    child.unrealize();
                });
                this.makeInvisible();
            }
        },

        /**
         * //TODOC
         */
        removeWidget: function () {
            this.visitAllChildren(function (child) {
                child.removeWidget();
            });
            _uf.vp.Node.prototype.removeWidget.call(this);
        },

        /**
         * //TODOC
         */
        adoptFosterChildren: function () {
            var me = this;
            this.visitFosterChildren(function (a_child) {
                a_child.occ = me;
            });
        },

        /**
         * //TODOC
         * @param a_occData
         * @param a_forceRealization
         */
        realize: function (a_occData, a_forceRealization) {
            // Realize all of the occurrence's content.
            var l_mustRender = false;
            this.link(a_occData);
            if (this.nodes.length === 1) {
                if (!this.widget && this.definition.widget) {
                    this.widget = UNIFACE.widgetFactory.create(this.definition.widget);
                    this.widget.callBack = this.createCallBack();
                    // Get declarative properties
                    l_mustRender = true;
                    if (!this.definition.declaredProps) {
                        // Get the widget default properties
                        this.definition.declaredProps = new _uf_ui.Props(this.definition.properties, {});

                        // Merge with the properties from the occurrence's DOM node.
                        this.definition.declaredProps.overlayWith(_uf_ui.getPropsFromDomNode(this.nodes[0]));
                    }
                }
                this.allProperties(this.definition, a_occData);
            }
            if (this.entity.occs[0] === this && !_luv.util.isEmptyObject(this.entity.fosterChildren)) {
                this.adoptFosterChildren();
                // Foster children were adopted,
                // so this occurrence needs to be (re-)realized for sure.
                a_forceRealization = true;
            }

            this.realizeContent(a_occData, a_forceRealization);
            this.createEvents([]);

            // Make the occurrence visible.
            this.makeVisible();
            if (this.widget) {
                if (l_mustRender) {
                    this.widget.render(this.nodes[0]);
                }
                this.postRealize(); // only postRealize for occurrences on the layout
            }
        },

        /**
         * //TODOC
         * @param a_occData
         * @param forceRealization
         */
        realizeContent: function (a_occData, forceRealization) {
            // Realization is required if caller says so, or if the supplied
            // occurrence data is 'dirty', which is an indication that the
            // occurrence data needs to be re-realized.
            var realizeThisOccurrence = forceRealization || (a_occData && !!_uf.data.isOccDirty(a_occData)),
                l_name, l_childName, occDef = this.definition;

            // Loop through the content of this occurrence.
            for (l_childName in occDef) if (occDef.hasOwnProperty(l_childName)) {
                var l_childDef = occDef[l_childName];
                if (l_childDef && typeof l_childDef.type === "string") {
                    var l_childData = _uf.data.getOccChild(a_occData, l_childName);
                    if (l_childData !== undefined) {
                        if (l_childDef.type === "entity") {
                            _luv.realizeEntity(this, l_childName, l_childDef, l_childData, forceRealization);
                        } else if (realizeThisOccurrence) {
                            if (l_childDef.type === "field") {
								_luv.realizeField(this, occDef, l_childName, l_childDef, l_childData, forceRealization);
                            } else if (l_childDef.type === "label") {
                                // Realize an unassociated label.
                                l_name = occDef[l_childName].nm;
                                if (!l_name) {
                                    l_name = l_childName;
                                }
                                l_childData.label_r_o = _luv.realizeLabel(this, l_name, l_childDef);
                            }
                        }
                    }
                }
            }

            // Reset the 'dirty' flag, to make sure that next time
            // this occurrence is not realized unnecessarily.
            _uf.data.setOccDirty(a_occData, false);
        },

        /**
         * Removes this occurrence.
         * This occurrence is first unrealized and removed from the occurrence
         * administration.  Then is is moved to the occurrence pool, unless it
         * is the one and only occurrence of its containing entity.  In the
         * latter case it should remain where it is, for two reasons:
         *      - It needs to stay, because it indicates where new occurrences
         *        should be added.
         *      - Removing it might result in an invalid tree (like an HTML
         *        table without any rows).
         */
        remove: function () {
            var removeAction = function (child) {
                var j;
                // We assume here that a child with an "occs" property indicates an inner entity.
                // and that a child with a "fieldId" property indicates a field.
                // TODO: a better way of determining this?
                if (child.hasOwnProperty("occs")) {
                    for (j = child.occs.length - 1; j >= 0; --j) {
                        child.occs[j].remove();
                    }
                } else if (child.hasOwnProperty("fieldId")) {
                    // This is a field.
                    // At this point the field might be in a "blocked" state,
                    // and therefore the widget is shown as blocked.
                    // Here we remove that blocked appearance, because, when
                    // the occurrence will be reused, its fields should
                    // not have the blocked appearance.
                    child.showUnblock();
                }
            };
            // First remove all inner occurrences!
            this.visitOwnChildren(removeAction);
            // Take care that this occurrence is no longer shown in the page.
            this.unrealize();

            // Remove this occurrence.
            this.instance.removeOccurrence(this);
        },

        /**
         * Checks whether a given node is among the tree of nodes that make
         * up this occurrence.
         * @param node Node to check
         * @return {boolean} true if and only if node is among the tree
         *      of nodes that make up this occurrence.
         */
        containsNode: function (node) {
            var i;
            for (i = 0; i < this.nodes.length; i++) {
                if (this.nodes[i] === node || this.nodes[i].contains(node)) {
                    return true;
                }
            }
            return false;
        },

        /**
         * //TODOC
         * @returns {global.uniface.Occurrence}
         */
        createApiObject: function () {
            var parentAPIObject = this.entity.getAPIObject();
            return new uniface.Occurrence(this.data, parentAPIObject);
        },

        /**
         * //TODOC
         * @returns {Number}
         */
        getHeight: function () {
            if (this.nodes.length == 1) {
                return this.nodes[0].getBoundingClientRect().height;
            }
            return;
        },

        /**
         * //TODOC
         * @returns {boolean}
         */
        select: function () {
            var a_occ = this.data,
                l_ent = this.entity,
                ent = a_occ.container,
                selChange = false;
            if (l_ent.definition.multiSelect) {
                // First see if the occurrence is already selected,
                // and then deselect it.
                var alreadySelected = _uf.data.isOccSelected(a_occ);
                _uf.data.setOccSelection(a_occ, false);
                // Deselect all currently selected occurrences
                selChange = setManyOccsSelection(ent, 0, ent.occs.length - 1, false);
                // Select the given occurrence
                _uf.data.setOccSelection(a_occ, true);
                selChange = selChange || !alreadySelected;
            } else if (l_ent.definition.singleSelect) {
                // Only select the occurrence if it not already is selected.
                if (ent.selectedOcc !== a_occ) {
                    // Deselect the previously selected occurrence
                    if (ent.selectedOcc) {
                        selChange = _uf.data.setOccSelection(ent.selectedOcc, false);
                    }
                    // Select the given occurrence
                    selChange = _uf.data.setOccSelection(a_occ, true) || selChange;
                    // Remember the selected occurrence.
                    ent.selectedOcc = a_occ;
                }
            } else {
                // Ignore; no selection allowed
            }
            return selChange;
        },

        /**
         * Does a control-select
         *
         * //TODOC
         *
         * @returns {boolean}
         */
        ctrlSelect: function () {
            var a_occ = this.data,
                l_ent = this.entity,
                ent = a_occ.container,
                selChange = false;
            if (l_ent.definition.multiSelect) {
                // Toggle the occurrence's selection state.
                selChange = _uf.data.setOccSelection(a_occ, !a_occ[1].isSelected);
            } else if (l_ent.definition.singleSelect) {
                if (ent.selectedOcc) {
                    if (ent.selectedOcc !== a_occ) {
                        selChange = _uf.data.setOccSelection(ent.selectedOcc, false);
                    }
                }
                // Toggle the occurrence's selection state.
                selChange = _uf.data.setOccSelection(a_occ, !a_occ[1].isSelected) || selChange;
                // Remember the selected occurrence.
                ent.selectedOcc = (a_occ[1].isSelected ? a_occ : null);
            } else {
                // Ignore; no selection allowed
            }
            return selChange;
        },

        /**
         * Does a shift-select
         *
         * //TODOC
         *
         * @returns {boolean}
         */
        shiftSelect: function () {
            var a_occ = this.data,
                l_ent = this.entity,
                ent = a_occ.container,
                selChange = false;
            if (l_ent.definition.multiSelect) {
                var i, j, k, allOccs;
                // Get the indices of the current and clicked occurrences
                allOccs = a_occ.container.occs;
                i = allOccs.indexOf(ent.curocc);
                j = allOccs.indexOf(a_occ);
                // If i is greater than j, swap them
                if (i > j) {
                    k = i;
                    i = j;
                    j = k;
                }
                // Select the indicated occurrences, deselect the others
                selChange = setManyOccsSelection(a_occ.container, 0, i - 1, false);
                selChange = setManyOccsSelection(a_occ.container, i, j, true) || selChange;
                selChange = setManyOccsSelection(a_occ.container, j + 1, allOccs.length - 1, false) || selChange;
            } else if (l_ent.definition.singleSelect) {
                // Act as a normal (non-shift) select:
                selChange = this.select();
            } else {
                // Ignore; no selection allowed
            }
            return selChange;
        },

        /**
         * Does a select-for-context
         *
         * //TODOC
         *
         * @returns {boolean}
         */
        contextSelect: function () {
            var a_occ = this.data,
                l_ent = this.entity,
                ent = a_occ.container,
                selChange = false;
            if (l_ent.definition.multiSelect || l_ent.definition.singleSelect) {
                // If the occurrence was already selected, then the context-select
                // does not change the selection.  If it was not already
                // selected, then the right-click selects it and deselects
                // all other occurrences, just like an ordinary select.
                if (!a_occ[1].isSelected) {
                    selChange = this.select();
                }
            } else {
                // Ignore; no selection allowed
            }
            return selChange;
        },

        /**
         * Tells if occurrence is selected
         *
         * //TODOC
         *
         * @returns {boolean}
         */
        isSelected: function () {
            return this.data[1].isSelected;
        }
    }); // _luv.occurrence.prototype


    ///////////////////////////////////////////////////////////////////////////////
    // _luv.entity
    ///////////////////////////////////////////////////////////////////////////////

    /**
     * //TODOC
     *
     * @constructor
     * @name entity
     * @memberof UNIFACE.luv
     * @extends _uf.vp.Node
     * @param a_occ
     * @param a_name
     * @param a_def
     */
    _luv.entity = function (a_occ, a_name, a_def) {
        a_occ.children[a_name] = this;
        this.occ = a_occ;
        this.occs = [];
        this.name = a_name;
        this.instance = a_occ.instance;
        this.definition = a_def;
        this.placeHolders = null;
        this.parentNode = null;

        this.maxOccurs = "unbounded";
        this.fosterChildren = {};
        this.postfix = (a_occ ? a_occ.postfix : "");

        if (a_def.maxOccurs !== undefined) {
            this.maxOccurs = a_def.maxOccurs;
        }

        this.events = {};

        this.widget = null;
    };

    _luv.entity.prototype = new _uf.vp.Node();

    UNIFACE.extend.call(_luv.entity.prototype, /** @lends UNIFACE.luv.entity */ {

        /**
         * //TODOC
         *
         * @type {String}
         */
        typeName: "entity",

        /**
         * //TODOC
         */
        postRealize: function () {
            this.widget.setProperties();
            /*if (this.mergedProperties.uniface && this.mergedProperties.uniface.errormsg)
             {
             this.showError(this.mergedProperties.uniface.errormsg);
             }*/
        },

        /**
         * //TODOC
         *
         * @returns {{getName: Function, getType: Function, getCalculatedProperties: Function, getDefProperty: Function, getEvents: Function, useDataScrolling: Function, getPageSize: Function, getRowHeight: Function, getPageStart: Function, nextPage: Function, getValue: Function}}
         */
        createCallBack: function () {
            var ent = this;  // Create closure
            return {
                getName: function () {
                    return ent.definition.nm;
                },
                getType: function () {
                    return "E";
                },
                getCalculatedProperties: function () {
                    return ent.mergedProperties;
                },
                getDefProperty: function (aPropName) {
                    return ent.definition.properties[aPropName];
                },
                getEvents: function () {
                    return ent.events;
                },
                useDataScrolling: function () {
                    return ent.definition.useDataScrolling;
                },
                getPageSize: function () {
                    return ent.definition.pagesize;
                },
                getRowHeight: function () {
                    if (ent.definition.rowHeight === undefined) {
                        ent.definition.rowHeight = ent.occs[0].getHeight();
                    }
                    if (ent.definition.rowHeight === undefined) {
                        ent.definition.rowHeight = 31; // Fallback.  TODO: think of something better...
                    }
                    return ent.definition.rowHeight;
                },
                getPageStart: function () {
                    return _uf.data.getEntPgStart(ent.data);
                },
                nextPage: function () {
                    // 1. Create scope
                    var l_scope = {
                        requesttype: "update",
                        input: [],
                        output: []
                    };

                    // Input is current occurrences


                    // 2. Make request
                    ent.events.nextpage();

                },
                getValue: function () {
                    return ent.data.complete ? "complete" : 0;
                }
            };
        },

        /**
         * Populates this.placeHolders. Populates this.parentNode only if
         * placeholder nodes are found.<br>
         * <br>
         * If placeholder nodes are found, walks DOM from the occurrence's
         * assigned start node to end node and clones all non-text nodes it
         * finds. Those newly created nodes are not attached to the DOM and set
         * to display:none. They are then assigned to this.placeHolders. The
         * old original nodes are returned.
         *
         * @returns {[HTMLElement]} A collection of nodes retrieved from the
         *      nodeMap local to UNIFACE.luv.component
         */
        findPlaceHolders: function () {
            var l_plh = [];
            if (this.hasNoPlaceholders) {
                return [];
            }
            if (!this.placeHolders) {
                var l_name = this.definition.nm;
                var l_occStart = _uf.DOMNodeManager.fetch("uocc:" + l_name, this.instance.instanceName);
                var l_occEnd = l_occStart;

                if (!l_occStart) {
                    l_occStart = _uf.DOMNodeManager.fetch("uocs:" + l_name, this.instance.instanceName);
                    l_occEnd = _uf.DOMNodeManager.fetch("uoce:" + l_name, this.instance.instanceName);
                }

                if (l_occStart && !(l_occEnd && (l_occStart.parentNode === l_occEnd.parentNode))) {
                    l_occEnd = l_occStart;
                }

                if (l_occStart) {
                    this.parentNode = l_occStart.parentNode;
                    var l_ph = l_occStart;
                    this.placeHolders = [];
                    while (l_ph !== l_occEnd.nextSibling) {
                        var l_newNode = l_ph.cloneNode(true);
                        if (l_newNode.nodeType !== 3) { // If not a text node...
                            l_newNode.setAttribute('U_display', l_newNode.style.display);
                            l_newNode.style.display = "none";
                        }
                        this.placeHolders.push(l_newNode);
                        l_plh.push(l_ph);
                        l_ph = l_ph.nextSibling;
                    }
                } else {
                    this.hasNoPlaceholders = true;
                }
            }
            return l_plh;
        },

        /**
         * //TODOC
         */
        unrealize: function () {
            var i;
            this.unlink();
            for (i = 0; i < this.occs.length; i++) {
                this.occs[i].remove();
            }
        },

        /**
         * //TODOC
         */
        removeWidget: function () {
            var i;
            for (i = 0; i < this.occs.length; i++) {
                this.occs[i].removeWidget();
            }
            _uf.vp.Node.prototype.removeWidget.call(this);
        },

        /**
         * //TODOC
         *
         * @param a_entityData
         */
        refresh: function (a_entityData) {
            _luv.busyRealizing = true;
            this.realize(a_entityData);
            this.instance.fireOnUpdate();
            _luv.busyRealizing = false;
        },

        /**
         * //TODOC
         *
         * @param a_entityData
         */
        realize: function (a_entityData) {
            this.link(a_entityData);
            var l_occs = this.occs,
                l_lastOcc = _uf.data.getOccCnt(a_entityData),
                l_maxOccurs = parseInt(this.maxOccurs, 10),
                l_occData,      // Occurrence data source being handled inside the loop.
                l_occ,          // Realized occurrence, inside the loop.
                i = 0, // Index in the list of visible occurrences
                l_occIdx = 0;// Index in the data source (includes deleted occurrences)

            if (isNaN(l_maxOccurs) || !l_maxOccurs) {
                l_maxOccurs = l_lastOcc;
            }

            // 1. Filled occurrences, empty occurrences, new occurrences
            while (i < l_maxOccurs && a_entityData && l_occIdx < l_lastOcc) {
                // Do not show deleted occurrences
                if (_uf.data.getOccStatus(_uf.data.getOcc(a_entityData, l_occIdx)) !== "del") {
                    l_occData = a_entityData.occs[l_occIdx];
                    l_occ = _luv.realizeOccurrence(this, l_occData, i);
                    if (l_occ) {
                        l_occ.dataIdx = l_occIdx;   // Map this visible occurrence to the data source
                    }
                    i++;
                }
                l_occIdx++;
            }

            UNIFACE.assert(i !== 0, "No occurrence realized");

            // 2. Occurrences that need to be deleted
            while (i < l_occs.length) {
                l_occs[i].remove();
            }

            //Set properties of the entity
            this.allProperties(this.definition, a_entityData);

            if (this.widget) {
                this.widget.setValue();
                this.postRealize(); // only postRealize for entities on the layout
            }
        },

        /**
         * //TODOC
         *
         * @returns {*|Array}
         */
        getCurrency: function () {
            return this.occ.getCurrency();
        },

        /**
         * //TODOC
         *
         * @returns {*}
         */
        createApiObject: function () {
            var parentAPIObject;
            if (this.occ.entity === this.occ.entity.instance) {
                parentAPIObject = uniface.getDSPInstance(this.occ.entity.instanceName);
            } else {
                parentAPIObject = this.occ.getAPIObject();
            }
            return parentAPIObject.getEntity(this.definition.nm);
        },

        /**
         * //TODOC
         *
         * @param a_modFunctions
         */
        createEvents: function (a_modFunctions) {
            _uf.vp.Node.prototype.createEvents.call(this, a_modFunctions);
        },

        /**
         * //TODOC
         *
         * @param a_def
         * @param a_data
         */
        calcProperties: function (a_def, a_data) {
            _uf.vp.Node.prototype.calcProperties.call(this, a_def, a_data);
            if (a_data && this.widget) {
                var stateProps = this.widget.stateProps;
                if (stateProps) {
                    this.mergedProperties.overlayWith(stateProps.plain);
                    if (_uf.data.isEntEmpty(a_data)) {
                        this.mergedProperties.overlayWith(stateProps.empty);
                    }
                }
            }
        }

    }); // _luv.entity.prototype

})(UNIFACE.luv, _uf, _uf.commands, _uf.ui);
/* %fv: utransp.js-159:ascii:1 % %dc: Fri May  8 12:42:32 2015 %*/

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/
 
/*******************************************************************************
date   refnum    version who description
080411 c26508    9.ajax  tsk mashup enablement
080508 c26571    9.ajax  mzu add more API function for unit test
080611 c26696    9.ajax  mzu Move command-related methods from ubase to udatalayer
080911 c27012    9.ajax  jdk Added webmessage
081015 c26877    9.ajax  jdk uwindow should be created without ID
081107 c27220    9.ajax  mzu Export AjaxRequest
090401 c27358    9401c1  fd  RIA: Use field IDs rather than names in the JSON stream.
090528 c27361    9401c1  mzu Change Command processing to a queue style.
100708 b28718    950101  jya field emptied by OnChange trigger if there is no output scope.
100924 c28495    950101  ahn Client side operations and triggers
110224 b29004    950101  jya CTRL-F5 in IE causes JS error
120313 b29586    E104    sse Add charset attribute to script node
150519 c31365    970101  tsk Support OUT parameters and return value for JS activate and createInstance
date   refnum    version who description
*******************************************************************************/

/*global UNIFACE uniface document XMLHttpRequest ActiveXObject alert window JSON doh utest _uf  Promise */
/// <reference path="ubase.js" />

// The transport layer API: _uf.transp.
(function (_uf_cmd) {
    var requestManager = (function () {
        var requestNextId = 1;
        var requestNum = 0;
        var _hadAsyncRequest = false;
        var requestMap = {};

        return {
            getReq: function (aID) { // Used only by UDOH
                return requestMap[aID];
            },

            registerReq: function (aReq) {
                if (!aReq.manageable) {
                    return;
                }
                if (aReq.id === undefined) {
                    aReq.id = this.generateId();
                }
                if (typeof requestMap[aReq.id] !== "object") {
                    requestNum++;
                    _hadAsyncRequest = true;
                }
                requestMap[aReq.id] = aReq;
            },

            unregisterReq: function (aId) {
                if (typeof requestMap[aId] === "object") {
                    if (requestNum > 0) {
                        requestNum--;
                    }
                    delete requestMap[aId];
                }
            },

            abortReq: function (aId) {
                var req = requestMap[aId];
                if (req) {
                    this.unregisterReq(aId);
                    if (req.scope) {
                        req.scope.unBlock();
                        req.setIndicated(false);
                    }
                }
            },

            abortAllReqs: function () { // Used only (indirectly and directly) by UDOH
                var id, req;
                for (id in requestMap) if (requestMap.hasOwnProperty(id)) {
                    this.abortReq(id);
                }
                this.clearRequestNum();
            },

            onStateChange: function (aId, resolve, reject) {
                if (true && typeof requestMap[aId] !== "undefined") {
                    requestMap[aId].onStateChange(resolve, reject);
                }
                else {
                    //reject(new Error("Request managaer: response came in for request "+ aId + ", but no such requets exists."));
                }
            },

            clearRequestNum: function () {
                requestNum = 0;
                _hadAsyncRequest = false;
                requestMap = {};
            },

            hadAsyncRequest: function () { // Used only by UDOH
                return _hadAsyncRequest;
            },

            shouldIdle: function () {
                return (requestNum === 0);
            },

            generateId: function () {
                var generatedId = requestNextId;
                requestNextId++;
                return generatedId;
            },

            getUpcomingRequestId: function () { // Used only by UDOH
                return requestNextId;
            }
        };
    })();

    function UnifaceRequest() {
    }

    UnifaceRequest.prototype.setOperation = function (a_operation) {
        this.operation = a_operation;
    };

    function SubmitRequest() {
        this.submitForm = document.createElement("form");
        this.submitForm.style.display = "none";
        this.submitForm.method = "POST";
        this.submitForm.acceptCharset = "UTF-8";
        this.paramElements = {};
        document.body.appendChild(this.submitForm);
    }

    SubmitRequest.prototype = new UnifaceRequest();


    SubmitRequest.prototype.addParam = function (a_paramName, a_paramValue) {
        if (this.paramElements[a_paramName] == undefined) /* pragma(allow-loose-compare) */ {
            this.paramElements[a_paramName] = document.createElement("textarea");
            this.paramElements[a_paramName].name = a_paramName;
            this.submitForm.appendChild(this.paramElements[a_paramName]);
        }
        this.paramElements[a_paramName].value = a_paramValue;
    };

    SubmitRequest.prototype.addBodyPart = SubmitRequest.prototype.addParam;

    SubmitRequest.prototype.setURL = function (a_url) {
        this.submitForm.action = a_url;
    };

    SubmitRequest.prototype.send = function () {
        if (typeof this.operation === "string" && this.operation !== "") {
            this.submitForm.action += ".";
            this.submitForm.action += this.operation;
        }
        this.addParam("u:requestType", "dynamic");
        this.addParam("u:responseType", "fullpage");

        this.submitForm.submit();
    };

    /**
    Helper function to create XMLHttpRequest object.
    Used in dynamic JS loading for browsers that do not have an onload/onreadystatechange
    event on script tags, and for AJAX requests.
    */
    function creXHR() {
        if (typeof window.ActiveXObject != 'undefined') {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        else {
            return new XMLHttpRequest();
        }
    }

    function AJAXRequest() {
        this.manageable = true;
        this.id = undefined;
        this.xmlDoc = creXHR();
        this.paramString = "";
        this.method = "POST";
        this.requestType = "dynamic";
        this.responseType = "update";
    }

    AJAXRequest.prototype = new UnifaceRequest();

    AJAXRequest.prototype.addParam = function (a_paramName, a_paramValue) {
        if (this.paramString.length !== 0) {
            this.paramString += "&";
        }
        this.paramString += encodeURIComponent(a_paramName) + "=" + encodeURIComponent(a_paramValue);
    };

    AJAXRequest.prototype.addBodyPart = AJAXRequest.prototype.addParam;

    AJAXRequest.prototype.setURL = function (a_url) {
        this.url = a_url;
    };

    /*------------------------------------------*/
    AJAXRequest.prototype.setIndicated = function (b) {
        // The request is done; turn off the busy-indicator.
        this.indicated = b;
        UNIFACE.extension.busyIndicator.setBusyAsync(b);
    };

    AJAXRequest.prototype.onStateChange = function (resolve, reject) {
        var l_promises = [];
        if (this.xmlDoc.readyState != 4) {
            return;
        }

        this.xmlDoc.onreadystatechange = _uf.nop;
        try {
            // The request is done; turn off the busy-indicator.
            this.setIndicated(false);
            requestManager.unregisterReq(this.id);

            // if "OK"
            if (true && this.xmlDoc.status == 200) {
                if (this.xmlDoc.responseText !== null) {
                    var upiput = null;
                    if (this.xmlDoc.responseText.substr(0, 1) === "<") {
                        if (/URD [0-9]+ Error/i.test(this.xmlDoc.responseText)) {
                            reject(new uniface.ServerError());
                        }
                        else {
                            reject(new uniface.UnifaceError());
                        }

                        UNIFACE.extension.popupWindow.showFailure('UNIFACE', 'Runtime error', 'Application error', this.xmlDoc.responseText);
                        return;
                    }
                    else {
                        try {
                            upiput = JSON.parse(this.xmlDoc.responseText);
                        }
                        catch (e) {
                            reject(e);
                        }
                    }

                    if (upiput) {
                        /*
                        Schedule all commands in this response.
                        Processing is performed in the finally block below.
                        */
                        l_promises.push(_uf_cmd.add({ beforeResponse: null }, this));
                        l_promises.push(_uf_cmd.add(upiput, this));
                        return;
                    }
                }
            }

            var l_errtext = "Server returned error code " + this.xmlDoc.status;

            if (!this.xmlDoc.status || this.xmlDoc.status > 999 /* ie 8 - 10 set status even if HTTP server not reached */) {
                reject(new uniface.TransportError("Network error" + this.xmlDoc.responseText + this.xmlDoc.statusText, this.url));
            }
            else {
                reject(new uniface.HTTPError(this.xmlDoc.status, this.xmlDoc.statusText, this.url));
            }
            if (doh && utest) {
                doh.debug(l_errtext);
            } else {
                alert(l_errtext);
            }

            return true;
        }
        finally {
            /* Schedule a command so that after this respone has been completely processed
             (e.g. all commands have been processed), the nodes that were blocked for this request are unblocked.
            */
            if (true && this.scope !== undefined) {
                l_promises.push(_uf_cmd.add({ unblock: this.instance }, this));
            }
            if (typeof this.callBack === "function") {
                l_promises.push(_uf_cmd.add({ callback: this.callBack }, this));
            }
            l_promises.push(_uf_cmd.add({ afterResponse: null }, this));
            resolve(Promise.all(l_promises));

            /* Process the scheduled commands */
            _uf_cmd.run();
        }
    };

    AJAXRequest.prototype.send = function (a_callback) {
        var me = this,
            id = this.id,
            wasCalled = false;
        //@c31365 Add value to resolve the promise with
        this.resolutionValue = {};

        this.callBack = a_callback;

        return new Promise(function (resolve, reject) {
            me.xmlDoc.onreadystatechange = function () {
                wasCalled = true;
                if (me.manageable) {
                    requestManager.onStateChange(id, resolve, reject);   // loose coupled by a string id
                } else {
                    me.onStateChange(resolve, reject);
                }
            };

            var targetUrl = me.url;
            if (typeof me.operation === "string" && me.operation !== "") {
                targetUrl += "." + me.operation;
            }

            if (me.method === "GET") {
                targetUrl += "?" + me.paramString;
            }

            me.xmlDoc.open(me.method, targetUrl, true);
            me.xmlDoc.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

            if (me.method === "POST") {
                me.addParam("u:requestType", me.requestType);
                me.addParam("u:responseType", me.responseType);
            }

            // Turn on the busy-indicator.
            me.setIndicated(true);

            // Immediately send the request.
            me.xmlDoc.send(me.paramString);
            requestManager.registerReq(me);
        }).then(function () { return me.resolutionValue; });
    };


    var requesttypes = {
        update: { callable: true, remote: true },
        fullpage: { callable: false, remote: true },
        indirect: { callable: false, remote: false },
        clientside: { callable: true, remote: false },
        delayed: { callable: true, remote: true }
    };

    _uf.transp =
    {
        is_callable: function (a_requesttype) {
            return requesttypes[a_requesttype] && requesttypes[a_requesttype].callable;
        },
        is_remote: function (a_requesttype) {
            return requesttypes[a_requesttype] && requesttypes[a_requesttype].remote;
        },
        createRequest: function (aTriggerType) {
            var l_req;
            if (aTriggerType == "FULLPAGE") {
                l_req = new SubmitRequest();
            } else {
                l_req = new AJAXRequest();
            }
            return l_req;
        },
        requestManager: requestManager
    };
})(_uf.commands);
/* %fv: udata.js-7.1.2:ascii:1 % %dc: Thu Aug 20 20:48:43 2015 %*/

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
080411 c26508    9.ajax  tsk mashup enablement
080508 c26571    9.ajax  mzu add more API function for unit test
080611 c26696    9.ajax  mzu Move command-related methods from ubase to udatalayer
080911 c27012    9.ajax  jdk Added webmessage
081015 c26877    9.ajax  jdk uwindow should be created without ID
081107 c27220    9.ajax  mzu Export AjaxRequest
090401 c27358    9401c1  fd  RIA: Use field IDs rather than names in the JSON stream.
090528 c27361    9401c1  mzu Change Command processing to a queue style.
100708 b28718    950101  jya field emptied by OnChange trigger if there is no output scope.
100924 c28495    950101  ahn Client side operations and triggers
110224 b29004    950101  jya CTRL-F5 in IE causes JS error
120313 b29586    E104    sse Add charset attribute to script node
date   refnum    version who description
*******************************************************************************/

/*global  _uf */

/// <reference path="uprops.js" />

// The internal datalayer API: _uf.data.
(function (_uf_ui) {
    function getNormalizedProps(a_data) {
        a_data.normalizedProps = a_data.normalizedProps || new _uf_ui.Props(a_data.properties, a_data.syntax ? a_data.syntax : {});
        return a_data.normalizedProps;
    }
    
    var idGenerator = (function () {
        var counter = 1;
        return {
            gen: function (a_inst) {
                return a_inst.definition.vuid + (counter++);
            }
        };
    })();

    function createOcc(a_inst, a_ent, a_def, a_idx, a_status) {
        var newOcc = {},
            child,
            def,
            i;

        // Generate an ID for the new occurrence.
        var l_newOcc = [idGenerator.gen(a_inst), newOcc];

        newOcc.status = (a_status === undefined ? "new" : a_status);
        l_newOcc.container = a_ent;
        // Create its fields and inner entities.
        for (var p in a_def) if (a_def.hasOwnProperty(p)) {
            def = a_def[p];
            child = { nm: def.nm, def: def, container: l_newOcc };
            if (def.type === "field") {
                if (def.initval !== undefined) {
                    child.value = def.initval;
                } else {
                    child.value = "";
                }
                if (def.hash !== undefined) {
                    child.hash = def.hash;
                }
                if (!child.value && !child.hash) {
                    child.isUntouched = true;
                }
            } else if (def.type === "entity") {
                child.type = "entity";
                child.occs = [];
                createOcc(a_inst, child, def.occs, 0, "empty");
            }
            newOcc[p] = child;
        }
        // Here's a piece of Uniface peculiarity as it occurs on the server,
        // copy-pasted from the Uniface documentation (with some markers in
        // between for easy reference):
        //    If the component contains only the default (empty) occurrence for
        //    an entity (*a*), the first use of creocc does not add an additional
        //    empty occurrence, while subsequent uses do.
        //    If the default occurrence contains either an initial value declared
        //    on the Define Component Field Properties form (*b*) or a field
        //    assigned a value with the /init switch (*c*), it is treated as an
        //    existing occurrence and a second occurrence is created.
        // So there is a clear difference in the behavior of 'creocc' between
        // case *a* on the one hand and cases *b* and *c* on the other.
        //
        // For occurrence creation on DSPs we want to mimic this behavior as
        // good as possible.
        // The piece of coding here deals with occurrence creation on the browser.
        // For all three cases above (*a*, *b* and *c*) we're dealing with an
        // occurrence that has status "empty", so we cannot use the occurrence
        // status to distinguish between the three cases.
        // Fortunately we *do* have initial value definitions as wel as current
        // values at our disposal, so we *can* distinguish between *a*, *b*
        // and *c*, albeit a bit laboriously.

        var index = _uf.data.findIndexOfEmptyOcc(a_ent);
        if (index >= 0) {
            if (_uf.data.isReallyEmpty(a_ent.occs[index], a_def)) {
                // Remove this empty occurrence
                a_ent.occs.splice(index, 1);
                if (index < a_idx) {
                    a_idx--;
                }
            } else {
                // Change the status of this "empty" occurrence to "new".
                a_ent.occs[index][1].status = "new";
            }
        }
        // Insert the new occurrence at the indicated place.
        a_ent.occs.splice(a_idx, 0, l_newOcc);
        return l_newOcc;
    }

    // Tells whether an entity is multi-select
    function isEntSingleSelect(a_ent) {
        return a_ent.def && a_ent.def.singleSelect;
    }

    // Tells whether an entity is multi-select
    function isEntMultiSelect(a_ent) {
        return a_ent.def && a_ent.def.multiSelect;
    }

    var postProcessOccData;
    // Makes the occurrences of an entity aware of
    // which entity is their container.
    // Makes the entity aware of which occurrence
    // is its current occurrence.
    function postProcessEntData(a_inst, a_ent, a_entDef, occs) {
        var l_changed = false;
        var i, occ;
        var singleSelection = false;
        if (occs === undefined) {
            occs = a_ent.occs;
        }
        // If no data available (yet), no postprocessing is needed...
        if (occs.length === 0 || occs[0] === null) {
            return;
        }
        a_ent.curocc = null;
        for (i = 0; i < occs.length; i++) {
            occ = occs[i];
            // See if the occurrence is current.
            _uf.data.syncOccCurrency(occ);
            if (occ[1].isCurrent) {
                a_ent.curocc = occ;
            }
            // Recurse into the occurrence.
            l_changed = postProcessOccData(a_inst, occ, a_entDef) || l_changed;
            // Make the occurrence aware of its container.
            occ.container = a_ent;
            // If the occurrence is marked as selected,
            // remove that marker if the entity's
            // "selection" property disallows it.
            // Note that this might happen, because
            // the back-end does not enforce the behavior
            // associated with the "selection property".
            _uf.data.syncOccSelection(occ);
            if (occ[1].isSelected) {
                if (isEntSingleSelect(a_ent)) {
                    if (a_ent.selectedOcc && a_ent.selectedOcc !== occ) {
                        // There was a previously selected occurrence.
                        // deselect that first.
                        a_ent.selectedOcc[1].isSelected = false;
                        // Make sure the back-end knows about this change.
                        l_changed = true;
                    }
                    a_ent.selectedOcc = occ;
                    singleSelection = true;
                } else if (!isEntMultiSelect(a_ent)) {
                    // No occurrences should be selected at all.
                    // Deselect it.
                    occ[1].isSelected = false;
                    // Make sure the back-end knows about this change.
                    l_changed = true;
                }
            }
        }
        if (isEntSingleSelect(a_ent) && !singleSelection) {
            a_ent.selectedOcc = null;
        }

        if (a_ent !== a_inst && a_ent.ro) {
            // This is a rendered entity object!
            // To (re)set indicator style on empty entity
            a_ent.ro.setProperties();
        }
        return l_changed;
    }

    // Makes the fields and entities of an occurrence aware of
    // which occurrence is their container.
    // Makes the entities aware of which occurrence is current.
    postProcessOccData = function (a_inst, a_occ, a_entDef) {
        var l_changed = false;
        for (var prop in a_occ[1]) if (a_occ[1].hasOwnProperty(prop)) {
            var child = a_occ[1][prop],
                l_def = a_entDef[prop];

            if ( l_def && typeof (child) === "object") {
                child.def = l_def;
                child.container = a_occ;
                if (child.occs) {
                    // Presumably this is an entity.
                    // Recurse into the entity.
                    if (l_def.occs) {
                        l_changed = postProcessEntData(a_inst, child, a_entDef[prop].occs) || l_changed;
                    }
                }
            }
        }
        return l_changed;
    };

    // Makes an occurrence current, as well
    // as its container (recursively).
    function makeOccCurrent(a_occ) {
        var l_ent = a_occ.container,
            l_changed = false;
        if (l_ent) {
            var oldCurocc = l_ent.curocc;
            if (oldCurocc != a_occ) {
                if (oldCurocc) {
                    // The old current occurrence will no
                    // longer be current.
                    oldCurocc[1].isCurrent = false;
                    // If the old current occurrence has a rendered object,
                    // then set it's properties (they may have changed
                    // because of the currency change).
                    if (oldCurocc.ro) {
                        oldCurocc.ro.setProperties();
                    }
                }
                // The given occurrence will be current.
                a_occ[1].isCurrent = true;
                // Make the container aware of
                // which of its occurrences is current.
                l_ent.curocc = a_occ;
                // Make sure the backend is aware of this currency change.
                l_changed = true;
            }
        }
        // If there is a containing occurrence
        // (an occurrence that contains a_occ's entity)
        // then that containing occurrence should also
        // be made current.
        if (l_ent.container) {
            _uf.data.setOccCurrent(l_ent.container);
        }
        // If the new current occurrence has a rendered object,
        // then set it's properties (they may have changed
        // because of the currency change).
        if (a_occ.ro) {
            a_occ.ro.setProperties();
        }
        return l_changed;
    }

    _uf.data =
    {
        // Instance functions
        postProcess: function (a_inst) {
            // Postprocess the instance's data.
            //    Note: the second argument in the call below
            //    is the instance in its role of entity,
            //    where its 'data' is a single occurrence
            //    that contains the instance's outer entities.
            return postProcessEntData(a_inst, a_inst, a_inst.definition, [a_inst.data]);
        },

        // Entity functions

        // get occurrence count
        getOccCnt: function (a_e) {
            return a_e.occs.length;
        },
        // get particular occurrence
        getOcc: function (a_e, a_idx) {
            return a_e.occs[a_idx];
        },
        // get current occurrence
        getCurOcc: function (a_e) {
            return a_e.curocc;
        },
        // create a new occurrence at a given index
        creOcc: function (a_inst, a_ent, a_def, a_idx, a_status) {
            if (a_idx < 0 || a_idx > a_ent.occs.length) {
                return null;    // Index out of range.
            }
            return createOcc(a_inst, a_ent, a_def.occs, a_idx, a_status);
        },
        // invalidate the entity and the structure inside it
        invalidateEnt: function (a_def, a_e) {
            a_e.isInvalid = true;
            for (var i = 0; i < a_e.occs.length; i++) {
                _uf.data.invalidateOcc(a_def, a_e.occs[i]);
            }
        },
        findIndexOfEmptyOcc: function (a_ent) {
            for (var i = a_ent.occs.length - 1; i >= 0; i--) {
                if (_uf.data.getOccStatus(a_ent.occs[i]) === "empty") {
                    return i;
                }
            }
            return -1;
        },
        getInstance: function (a_obj) {
            var dobj = a_obj.container;
            while (dobj && dobj.container) {
                dobj = dobj.container;
            }
            return dobj;
        },
        // clear the entity (discard all occurrences)
        clearEnt: function (a_ent) {
            // Invalidate all occurrences.
            var occ;
            for (var i = a_ent.occs.length - 1; i >= 0; i--) {
                occ = a_ent.occs[i];
                _uf.data.invalidateOcc(a_ent.def, occ);
            }
            // Physically remove all occurrences from the entity.
            a_ent.occs = [];
            // Create a new, empty occurrence.
            _uf.data.creOcc(_uf.data.getInstance(a_ent), a_ent, a_ent.def, 0, "empty");
        },

        getEntPgStart: function (a_ent) {
            return a_ent.pagestart;
        },
        getEntUpdateMode: function (a_ent) /* c29685 */ {
            return a_ent.updateMode;
        },

        // Occurrence functions
        // get a child
        getOccChild: function (a_o, a_id) {
            return _uf.data.getOccChildren(a_o)[a_id];
        },
        // get list of children
        getOccChildren: function (a_o) {
            return a_o[1];
        },
        // get the occID
        getOccId: function (a_o) {
            return _uf.data.getOccStatus(a_o) === 'empty' ? '---empty' : a_o[0];
        },
        // get the occID
        realOccId: function (a_o) {
            return a_o[0];
        },
        // is the occurrence modified
        isOccMod: function (a_occ) {
            return a_occ.modFlag !== undefined;
        },
        // clear the occurrence modification status
        clearOccMod: function (a_occ) {
            a_occ[1].status = this.getOccStatus(a_occ);
            delete a_occ.modFlag;
        },
        // mark the occurrence (and its ancestors) as modified.
        setOccMod: function (a_occ, marker) {
            var wasEmpty = !(_uf.data.isOccMod(a_occ));
            if (marker === undefined) {
                marker = "default";
            }
            a_occ.modFlag = marker;
            // If changing from empty to not-empty, for a rendered object,
            // the properties may have changed.
            if (wasEmpty && a_occ.ro) {
                a_occ.ro.setProperties();
                // setProperties for container entity
                if(a_occ.container.container){ 
                    a_occ.container.ro.setProperties();
                }
            }
        },
        // get the CRC
        getOccCRC: function (a_o) {
            return a_o[1].crc;
        },
        // get the occurrence's status
        getOccStatus: function (a_o) {
            if (a_o.modFlag) {
                switch (a_o[1].status) {
                    case "est": return "mod";
                    case "empty": return "new";
                }
            }
            return a_o[1].status;
        },
        // tet the occurrence's status as it was last received from the server
        getOccServerStatus: function (a_o) {
            return a_o[1].status;
        },
        isOccDirty: function (a_o) {
            return a_o.dirty;
        },
        setOccDirty: function (a_o, a_nv) {
            a_o.dirty = a_nv;
        },
        isOccValid: function (a_o) {
            return !a_o.isInvalid;
        },
        incOccBlock: function (a_o) {
            a_o.block = a_o.block ? a_o.block + 1 : 1;
        },
        decOccBlock: function (a_o) {
            a_o.block = a_o.block ? a_o.block - 1 : 0;
        },
        isOccBlocked: function (a_o) {
            return a_o.block;
        },
        getOccValErr: function (a_o) {
            return a_o[1].valerr;
        },
        // copy occurrence CRC, ID, valErr and status
        copyOccAttributes: function (a_occTo, a_occFrom) {
            if (a_occFrom[0] !== undefined) {
                a_occTo[0] = a_occFrom[0];
            }
            if (a_occFrom[1].crc !== undefined) {
                a_occTo[1].crc = a_occFrom[1].crc;
            }
            if (a_occFrom[1].valerr !== undefined) {
                a_occTo[1].valerr = a_occFrom[1].valerr;
            }
            if (a_occFrom[1].status !== undefined) {
                a_occTo[1].status = a_occFrom[1].status;
            }
            if (a_occFrom.hasOwnProperty("modFlag")) {
                a_occTo.modFlag = a_occFrom.modFlag;
            }
            else if (a_occTo.hasOwnProperty("modFlag")) {
                delete a_occTo.modFlag;
            }
            if (a_occFrom[1].isCurrent !== undefined) {
                a_occTo[1].isCurrent = a_occFrom[1].isCurrent;
            }
            if (a_occFrom[1].isSelected !== undefined) {
                a_occTo[1].isSelected = a_occFrom[1].isSelected;
            }
        },
        // Serialize (part of) the occurrence
        serializeOccAttributes: function (a_occ, a_serializedOcc) {
            var crc = _uf.data.getOccCRC(a_occ),
                valerr = _uf.data.getOccValErr(a_occ);
            if (crc !== undefined) {
                a_serializedOcc.crc = crc;
            }
            if (valerr !== undefined) {
                a_serializedOcc.valerr = valerr;
            }

            if (_uf.data.mustSaveOccCurrency(a_occ)) {
                a_serializedOcc.isCurrent = _uf.data.isOccCurrent(a_occ);
                _uf.data.syncOccCurrency(a_occ);
            }
            if (_uf.data.mustSaveOccSelection(a_occ)) {
                a_serializedOcc.isSelected = _uf.data.isOccSelected(a_occ);
                _uf.data.syncOccSelection(a_occ);
            }

            return true;
        },

        // serialize occ status
        serializeOccStatus: function (a_occ, a_serializedOcc) {
            if (_uf.data.getOccStatus(a_occ) !== undefined) {
                a_serializedOcc.status = _uf.data.getOccStatus(a_occ);
                // Clear the occurrence modification flag, making the data ready
                // to be merged with the response from the server.
                _uf.data.clearOccMod(a_occ);
            }
        },
        // Sets or clears the selection state of an occurrence.
        // Returns true if and only if the selection changed.
        setOccSelection: function (a_occ, selection) {
            if (a_occ[1].isSelected !== selection) {
                // Set the selection state.
                a_occ[1].isSelected = selection;
                // Make it visible by changing properties accordingly.
                if (a_occ.ro) {
                    a_occ.ro.setProperties();
                }
                return true;
            }
            return false;
        },
        // Tell whether an occurrence is really empty.
        // This is important for creocc situations; an occurrence
        // with status "empty" which has initial field values of
        // some sort, is not considered as "empty" by creocc
        // (see Uniface documentation).
        isReallyEmpty: function (a_occ, a_def) {
            var child,
            def;
            if (_uf.data.getOccStatus(a_occ) != "empty") {
                return false;
            }
            for (var p in a_def) if (a_def.hasOwnProperty(p)) {
                def = a_def[p];
                if (def.type === "field") {
                    var fld = _uf.data.getOccChild(a_occ, p);
                    if (def.initval !== undefined) {
                        // There is a field with an initial value;
                        // this means that the occurrence is not really empty.
                        return false;
                    } else if (fld.value !== "") {
                        // A non-empty value while there is no initial value
                        // means that the occurrence is not really empty.
                        return false;
                    }
                }
            }
            return true;
        },
        remOcc: function (a_inst, a_def, a_e, a_o, a_recurse) {
            var i;
            if (a_recurse) {
                var child, childDef;
                var l_o = _uf.data.getOccChildren(a_o);
                for (var p in l_o) if (l_o.hasOwnProperty(p)) {
                    child = l_o[p];
                    childDef = a_def.occs[p];
                    if (childDef && childDef.type === "entity") {
                        for (i = child.occs.length - 1; i >= 0; i--) {
                            _uf.data.remOcc(a_inst, childDef, child, child.occs[i], a_recurse);
                        }
                    }
                }
            }
            var status = _uf.data.getOccStatus(a_o);
            if (status !== "empty" && status !== "new") {
                // Existing occurrence; simply change its status to "del".
                a_o[1].status = "del";
            } else {
                // New occurrence; physically remove it from its parent
                _uf.data.invalidateOcc(a_def, a_o);
                for (i = 0; i < a_e.occs.length; i++) {
                    if (a_e.occs[i] === a_o) {
                        a_e.occs.splice(i, 1);
                    }
                }
            }
            // At this point we might end up with zero occurrences.
            // In such a case, like in "client-server mode",
            // we'll create a new, empty occurrence.
            var occSeen = false;

            i = a_e.occs.length - 1;
            while (i >= 0 && !occSeen) {
                occSeen = _uf.data.getOccStatus(a_e.occs[i--]) !== "del";
            }
            if (!occSeen) {
                _uf.data.creOcc(a_inst, a_e, a_def, 0, "empty");
            }
        },
        discardOcc: function (a_inst, a_def, a_e, a_o) {
            // Physically remove it from its parent
            _uf.data.invalidateOcc(a_def, a_o);
            var i;
            for (i = 0; i < a_e.occs.length; i++) {
                if (a_e.occs[i] === a_o) {
                    a_e.occs.splice(i, 1);
                }
            }
            // At this point we might end up with zero occurrences.
            // In such a case, like in "client-server mode",
            // we'll create a new, empty occurrence.
            var occSeen = false;
            i = a_e.occs.length - 1;
            while (i >= 0 && !occSeen) {
                occSeen = _uf.data.getOccStatus(a_e.occs[i--]) !== "del";
            }
            if (!occSeen) {
                _uf.data.creOcc(a_inst, a_e, a_def, 0, "empty");
            }
        },
        isInstanceOcc: function (a_occ) {
            return !a_occ.container.container;
        },
        invalidateOcc: function (a_def, a_o) {
            a_o.isInvalid = true;
            var l_child;
            var l_childDef;
            var l_childData;
            var l_childType;
            var l_o = _uf.data.getOccChildren(a_o);
            for (l_child in a_def) if (l_o.hasOwnProperty(l_child)) {
                l_childDef = a_def[l_child];
                l_childType = l_childDef.type;
                if (typeof l_childType == "string") {
                    l_childData = l_o[l_child];
                    if (l_childData) {
                        if (l_childType === "field") {
                            _uf.data.invalidateFld(l_childDef, l_childData);
                        } else {
                            _uf.data.invalidateEnt(l_childDef, l_childData);
                        }
                    }
                }
            }
        },

        // Set the label value
        setLabelValue: function(a_f, labelValue) {
            a_f.labelValue = labelValue;
        },

        // Get the field value
        getFldValue: function (a_f) {
            return a_f.value;
        },
        // Set the field value
        setFldValue: function (a_f, value) {
            a_f.value = value;
            delete a_f.isUntouched;
        },
        // Get the field valrep
        getFldValrep: function (a_f) {
            return a_f.valrep;
        },
        // Set the field valrep
        setFldValrep: function (a_f, valrep) {
            a_f.valrep = valrep;
        },
        // Get the field resource
        getFldResource: function (a_f) {
            return a_f.resource;
        },
        occurrence: {
            getNormalizedProps: function (a_data) {
                a_data.normalizedProps = a_data.normalizedProps || new _uf_ui.Props(a_data[1].properties, {});
                return a_data.normalizedProps;
            }
        },
        entity: {
            getNormalizedProps: getNormalizedProps
        },
        field: {
            getNormalizedProps: getNormalizedProps
        },

        // invalidate the field
        invalidateFld: function (a_def, a_f) {
            a_f.isInvalid = true;
        },

        // is the field modified
        isFldMod: function (a_fld) {
            return a_fld.modFlag !== undefined;
        },
        // clear the field modification status
        clearFldMod: function (a_fld) {
            delete a_fld.modFlag;
        },
        // mark the field as modified.
        setFldMod: function (a_fld) {
            a_fld.modFlag = true;
        },


        // Tells whether the entity is empty
        isEntEmpty: function (a_ent) {
            if (a_ent.occs !== undefined && a_ent.occs.length === 1) {
                return _uf.data.isOccEmpty(a_ent.occs[0]);
            } else {
                return false;
            }
        },
        // Tells whether an occurrence is the empty one
        isOccEmpty: function (a_occ) {
            return _uf.data.getOccStatus(a_occ) === "empty";
        },
        // Tells whether an occurrence is current
        isOccCurrent: function (a_occ) {
            return a_occ[1].isCurrent;
        },
        // Makes an occurrence the current occurrence,
        // and recursively makes its container also current.
        setOccCurrent: function (a_occ) {
            return makeOccCurrent(a_occ);
        },
        // Tells whether an occurrence is selected
        isOccSelected: function (a_occ) {
            return a_occ[1].isSelected;
        },
        // Synchronizes wasSelected with isSelected
        syncOccSelection: function (a_occ) {
            a_occ[1].wasSelected = a_occ[1].isSelected;
        },
        // Synchronizes wasCurrent with isCurrent
        syncOccCurrency: function (a_occ) {
            a_occ[1].wasCurrent = a_occ[1].isCurrent;
        },
        // Tells whether occurrence selection changes since last sync
        mustSaveOccSelection: function (a_occ) {
            return a_occ[1].isSelected;
        },
        // Tells whether current occurrence changes since last sync
        mustSaveOccCurrency: function (a_occ) {
            return a_occ[1].isCurrent;
        }
    };
})(_uf.ui);



/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*global UNIFACE JSON _uf uf_clientside uniface */




/**
 * //TODOC
 * Scope object
 * @type {{NONE: string, ALL: string, CURRENT: string, FIRST: string, LAST: string, MOD: string, NEW: string, SPECIFIC: string, NEXTPAGE: string, PREVPAGE: string}}
 */
var Scope = {
    NONE        : "0",
    ALL         : "*",
    CURRENT     : ".",
    FIRST       : "1",
    LAST        : "n",
    MOD         : "mod",
    NEW         : "new",
    SPECIFIC    : "id",
    NEXTPAGE    : ">",
    PREVPAGE    : "<"
};

/**
 * //TODOC
 * @type {{requesttype: string, input: Array}}
 */
var initialRequestScope = { requesttype: "update", input: [] },
    ONETIME_PROPS =
    {
        "uniface":
        {
            "errormsg" : true,
            "subclass" : true
        }
    };



/**
 * //TODO remove function from global scope
 * Merge 2 scope objects
 * @param a_c1
 * @param a_c2
 * @returns {*}
 */
function mergeScope(a_c1, a_c2)
{
    /*
     Since 'undefined' (default) means 'everything'
     */
    if (a_c2 === undefined || a_c1  === undefined)
    {
        return undefined;
    }

    if (typeof a_c1 == "object" || typeof a_c2 == "object")
    {
        var i;
        if (a_c1.constructor == Array)
        {
            if (a_c1.length === 0)
            {
                return a_c2;
            }
            if (a_c2.length === 0)
            {
                return a_c1;
            }
            var l_a = [];

            for (i=0; i< a_c1.length; i++)
            {
                l_a.push(a_c1[i]);
            }
            for (i=0; i< a_c2.length; i++)
            {
                l_a.push(a_c2[i]);
            }
            return l_a;
        }
        else
        {
            var l_c = { };

            for (i in  a_c1) if (i != "selector" && a_c1.hasOwnProperty(i))
            {
                l_c[i] = a_c1[i];
            }
            for (i in a_c2) if (i != "selector" && a_c2.hasOwnProperty(i))
            {
                l_c[i] = mergeScope( a_c2[i], l_c[i]);
            }
            return l_c;
        }
    }
    else
    {
        return a_c1 || a_c2;
    }
}



/**
 * //TODO remove function from global scope
 * Return true if a scope declaration is empty, i.e.
 * a scope/endscope block or begin/end block without contents - meaning 'nothing'
 * on this level is in scope
 * Otherwise: false (currently meaning 'everything' on this level is in scope, but this will change
 *
 * @param a_scope
 * @returns {boolean}
 */
function isEmptyScope(a_scope)
{

    if (a_scope === undefined)
    {
        return false;
    }

    var l_empty = false;
    if (a_scope.entities !== undefined)
    {
        if (a_scope.entities.length !== 0)
        {
            return false;
        }
        l_empty = true;
    }
    if (a_scope.fields !== undefined)
    {
        l_empty = (a_scope.fields.length === 0);
    }
    return l_empty;
};







(function (_uf_ui, _uf_tr, _ufd, _ufc, _uf_instance_manager) {
    "use strict";


    /**
     *
     * //TODOC
     *
     */
    function nop() { }


    /**
     *
     * Helper function to resolve entity/field selectors to a list of
     * actual entities/fields in scope.
     *
     * @param a_realizedField
     * @param a_fieldDef
     * @param a_data
     * @param a_scope
     * @returns {{match: boolean, scope: undefined}}
     */
    function checkChildInScope(a_realizedField, a_fieldDef,  a_data, a_scope)
    {
        var l_scope = { match: false, scope: undefined };
        if (a_scope === undefined)
        {
            // Leaf node. Default (=all) child scope:
            l_scope.match = true;
        }
        else
        {
            var i;
            var l_collectionName;
            l_scope.scope = [];
            // Match, construct child scope
            if (a_fieldDef.type == "field")
            {
                l_collectionName = "fields";
            }
            else if (a_fieldDef.type == "entity")
            {
                l_collectionName = "entities";
            }

            if (a_scope[l_collectionName] === undefined)
            {
                a_scope[l_collectionName] = [];
            }
            /*        if (a_scope[l_collectionName].length > 0)
             {
             UNIFACE.throwException("Error: scope selectors not supported yet.");
             }*/

            for (i=0; i< a_scope[l_collectionName].length; i++)
            {
                // Try to match,
                if (a_fieldDef.id in a_scope[l_collectionName][i]) {
                    l_scope.match = true;
                    l_scope.scope = mergeScope(l_scope.scope, a_scope[l_collectionName][i][a_fieldDef.id]);
                }
            }
        }
        return l_scope;
    }




    /**
     *
     * Helper function to resolve occurrence selectors from a scope to a list
     * of actual affected occurrences.
     *
     * @param a_realizedEntity
     * @param a_data
     * @param a_scope
     * @param a_currentPath
     * @returns {Array} an array of occurrences that are in scope
     */
    function findOccsInScope(a_realizedEntity, a_data, a_scope, a_currentPath )
    {
        var l_occs = [];
        var l_incOccs = [];

        function addOcc(a_occ, scp)
        {
            a_occ.scp = mergeScope(scp, a_occ.scp);
            if (!a_occ.inc)
            {
                a_occ.inc = true;
                l_incOccs.push(a_occ);
            }
        }

        var i;
        for (i=0; i< _ufd.getOccCnt(a_data); i++)
        {
            l_occs.push({stoc: null, daoc: _ufd.getOcc(a_data, i), inc:false, scp: null });
        }
        if (a_realizedEntity)
        {
            for (i=0; i<a_realizedEntity.occs.length && a_realizedEntity.occs[i].realized; i++)
            {
                l_occs[a_realizedEntity.occs[i].dataIdx].stoc = a_realizedEntity.occs[i];
            }
        }

        if (a_scope === undefined)
        {
            for (i =0; i< l_occs.length; i++)
            {
                addOcc(l_occs[i], undefined);
            }
        }
        else
        {
            var l_sc;
            for (l_sc in a_scope) if (a_scope.hasOwnProperty(l_sc))
            {
                var l_scd = a_scope[l_sc];
                var occData;
                switch ( l_sc )
                {
                    case Scope.ALL:
                        for (i =0; i< l_occs.length; i++)
                        {
                            addOcc(l_occs[i], l_scd);
                        }
                        break;
                    case Scope.CURRENT:
                        if (a_currentPath !== null && a_currentPath[0] && a_currentPath[0].entity === a_realizedEntity)
                        {
                            addOcc(l_occs[a_currentPath[0].dataIdx], l_scd);
                        }
                        break;
                    case Scope.FIRST:
                        if (l_occs.length > 0)
                        {
                            addOcc(l_occs[0], l_scd);
                        }
                        break;
                    case Scope.LAST:
                        if (l_occs.length > 0)
                        {
                            addOcc(l_occs[l_occs.length-1], l_scd);
                        }
                        break;
                    case Scope.MOD:
                        for (i =0; i< l_occs.length; i++)
                        {
                            occData = l_occs[i].daoc;
                            if (occData && _ufd.getOccStatus(occData) === "mod")
                            {
                                addOcc(l_occs[i], l_scd);
                            }
                        }
                        break;
                    case Scope.NEW:
                        for (i =0; i< l_occs.length; i++)
                        {
                            occData = l_occs[i].daoc;
                            if (occData && _ufd.getOccStatus(occData) === "new")
                            {
                                addOcc(l_occs[i], l_scd);
                            }
                        }
                        break;
                }
            }
        }
        return l_incOccs;
    }

    /**
     * //TODO remove from global scope
     * //TODOC
     * @param a_oldData
     * @param a_newData
     * @param a_normalizedProps
     * @returns {*}
     */
    _uf.scope.mergeProps = function mergeProps(a_oldData, a_newData, a_normalizedProps) {
        if (typeof a_newData.properties !== "object") {
            a_newData.properties = {};
        }

        if (a_normalizedProps === undefined) {
            a_normalizedProps = new _uf_ui.Props(a_oldData.properties);
        }

        var l_onetime;
        for (l_onetime in ONETIME_PROPS) {
            if (a_normalizedProps[l_onetime] !== undefined) {
                var l_prp;
                for (l_prp in ONETIME_PROPS[l_onetime]) {
                    if (a_normalizedProps[l_onetime][l_prp] !== undefined) {
                        delete a_normalizedProps[l_onetime][l_prp];
                    }
                }
            }
        }

        if (a_newData.syntax !== undefined) {
            a_oldData.syntax = a_newData.syntax;
        }

        // Overlay oldData's properties with newData's properties
        a_normalizedProps.merge(a_newData.properties, a_oldData.syntax);

        return a_normalizedProps;
    };


/**
 *  For each node type, (entity, occurrence, field, label, instance) in implementation of a few functions:
 *  serialize:
 *  Create a JSON item for the node (and recursively for contained nodes) taking input scope into account
 *  as a side effect, determine valid currence taking input scope into account (i.e. only set current
 *  occurrence to an occurrence that is actually sent to the server)
 *  blockScope :
 *  (recursively) Block the node if the output scope requires that.
 *  Return a structure describing all the blocked nodes.
 *  The returned structure is attached to the queued/executed request so it can be unblocked later
 *  checkScope :
 *  Check recursively check that the node (or any of its children) is not blocked
 *  unblockScope :
 *  Unblock any blocked nodes. Input is the data structure produced by blockScope
 * @type {{entity: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function, merge: Function, mergeOccs: Function}, occurrence: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function, merge: Function}, field: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function, merge: Function}, label: {serialize: *, blockScope: *, checkScope: *, unblockScope: *}, instance: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function}}}
 */
var nodes =
{
	// The errors array aggregates syntax errors during the field.serialize operation. 
    errors: [],

    entity : {
        serialize : function (a_realizedEntity,  a_entityDef, a_data, a_scope, a_currentPath, r_ccyInScope, a_justCheck, a_includeEmpty)
        {
            var l_json;
            var l_incOccs = findOccsInScope(a_realizedEntity,a_data, a_scope, a_currentPath);

            if (a_scope && a_scope.hasOwnProperty(Scope.NEXTPAGE))
            {
                l_json = {};
                // Add page number
                l_json.pagestart = _ufd.getOccCnt(a_data)+1;
                l_json.pagesize = a_entityDef.pagesize;
            }

            if (l_incOccs.length>0)
            {
                var i;
                l_json = l_json || {};

                l_json.occs = [];
                for (i =0; i< l_incOccs.length; i++)
                {
                    if (a_includeEmpty || _ufd.getOccStatus(l_incOccs[i].daoc) !== "empty")
                    {
                        var lP = null;
                        if (!a_justCheck && a_currentPath != null && l_incOccs[i].stoc === a_currentPath[0]) /* pragma(allow-loose-compare) */
                        {   /* This occ is on the active path */
                            lP = a_currentPath.slice(1);
                            r_ccyInScope.push(a_currentPath[0]);
                        }

                        var l_tmpJson = nodes.occurrence.serialize(l_incOccs[i].stoc, a_entityDef.occs, l_incOccs[i].daoc, l_incOccs[i].scp, lP, r_ccyInScope, a_justCheck, a_includeEmpty);
                        /* optimization for HTML : push the occurrences only if some changes has made */
                        if(l_tmpJson !== undefined)
                        {
                            l_json.occs.push([_ufd.getOccId(l_incOccs[i].daoc),l_tmpJson]);
                        }
                    }
                }
            }

            if (a_justCheck)
            {
                return;
            }

            return l_json;
        },

        blockScope : function(a_realizedEntity, a_entityDef, a_data, a_scope, a_currentPath )
        {
            var l_blocked = { rel : a_realizedEntity, def : a_entityDef, dat : a_data, occs: {}, b:false };
            var l_incOccs = findOccsInScope(a_realizedEntity,a_data, a_scope, a_currentPath);

            if (a_scope === undefined) {
                l_blocked.b = true;
                a_data.block = (a_data.block ? a_data.block + 1 : 1);
            }
            else {
                if (a_scope.hasOwnProperty(Scope.NEXTPAGE))
                {
                    l_blocked.b = true;
                    l_blocked.insertionPoint = Scope.NEXTPAGE;
                    a_data.block = (a_data.block ? a_data.block + 1 : 1);
                }
            }
            if (a_data.block == 1 && a_realizedEntity) {
                a_realizedEntity.showBlock();
            }

            if (l_incOccs.length>0)
            {
                var i;
                for (i =0; i< l_incOccs.length; i++)
                {
                    var lP = null;
                    if (a_currentPath != null && l_incOccs[i].stoc === a_currentPath[0]) /* pragma(allow-loose-compare) */
                    {   /* This occ is on the active path */
                        lP = a_currentPath.slice(1);
                    }
                    l_blocked.occs[_ufd.realOccId(l_incOccs[i].daoc)] = nodes.occurrence.blockScope(l_incOccs[i].stoc, a_entityDef.occs, l_incOccs[i].daoc, l_incOccs[i].scp, lP );
                }
            }
            return l_blocked;
        },

        checkScope : function(a_realizedEntity, a_entityDef, a_data, a_scope, a_currentPath )
        {
            var l_blocked;
            if (a_data.block)
            {
                return true;
            }
            var l_incOccs = findOccsInScope(a_realizedEntity,a_data, a_scope, a_currentPath);

            if (l_incOccs.length>0)
            {
                var i;
                l_blocked = [];
                for (i =0; i< l_incOccs.length; i++)
                {
                    var lP = null;
                    if (a_currentPath != null && l_incOccs[i].stoc === a_currentPath[0]) /* pragma(allow-loose-compare) */
                    {   /* This occ is on the active path */
                        lP = a_currentPath.slice(1);
                    }
                    if (nodes.occurrence.checkScope(l_incOccs[i].stoc, a_entityDef.occs, l_incOccs[i].daoc, l_incOccs[i].scp, lP ))
                    {
                        return true;
                    }
                }
            }
            return false;
        },

        unblockScope : function(a_outScope )
        {
            var l_occ;
            a_outScope.dat.block = a_outScope.dat.block ? a_outScope.dat.block - 1 : 0;

            if (a_outScope.rel != null && a_outScope.dat.block === 0) // pragma(allow-loose-compare)
            {
                a_outScope.rel.showUnblock();
            }

            for (l_occ in a_outScope.occs) if (a_outScope.occs.hasOwnProperty(l_occ))
            {
                nodes.occurrence.unblockScope(a_outScope.occs[l_occ]);
            }
        },

        merge : function( a_entityDef, a_oldData, a_newData, a_scope )
        {
            // merge current/front-end (a_oldData) with new/back-end (a_newData) data using scope (when defined)
            // @c30047: rewritten for paginated data, see l_dataMode
            a_oldData.normalizedProps = _uf.scope.mergeProps(a_oldData, a_newData, a_oldData.normalizedProps);

            // @c30208 due to optimisation, the entire 'occs' property may be missing.
            if (a_newData.occs) {
                this.mergeOccs(a_entityDef, a_oldData, a_newData, a_scope);
            }
        },

        mergeOccs : function( a_entityDef, a_oldData, a_newData, a_scope )
        {
            if (a_scope === undefined)
            {
                a_scope = { b : true };
            }
            var i,
                l_oldIdx = {},      // index of current set using occ-id
                l_oldOccs,          // current set occs
                l_id,
                l_occ;              // occ being handled

            l_oldOccs = a_oldData.occs; // remember current occs

            if (true && a_scope.b)
            {   // full scope (or no scope)
                // @c29685: check for incremental update
                var l_increment = false, l_append = false, l_new = false;
                var l_dataMode = _ufd.getEntUpdateMode(a_newData);

                switch(l_dataMode)
                {
                    case "incremental":
                        l_increment = true; // update with incremental data
                        break;
                    case "suffix":
                        l_append = true;    // append with new page of data
                        break;
                    case "full":            // pragma(fallthrough)
                    default:
                        l_new = true;       // overwrite with new data
                        break;
                }

                if (a_scope.insertionPoint === Scope.NEXTPAGE) {
                    l_append = true;
                    l_new = false;
                    l_increment = false;
                }

                // 1. Build index of current set using occ-id
                for (i = 0; i< l_oldOccs.length; i++)
                {
                    l_occ = l_oldOccs[i];
                    l_oldIdx[_ufd.getOccId(l_occ)] = l_occ;
                    _ufd.setOccDirty(l_occ, false);
                }

                if (l_new)
                {   // full page (non-incremental update)
                    a_oldData.occs = a_newData.occs;    // replace all current with new data
                }

                if (l_new || l_increment)
                {   // 3a. Overlay current set with new or update
                    for (i = 0; i< a_newData.occs.length; i++)
                    {
                        l_id = _ufd.getOccId(a_newData.occs[i]);
                        l_occ = l_oldIdx[l_id]; // get current occ

                        if (l_occ !== undefined)
                        {   // Occurrence matches one in current data
                            // Remove the index from the index list, since it's still valid..
                            delete l_oldIdx[l_id];

                            // Overlay is done with new data
                            _ufd.setOccDirty(l_occ, true);

                            // merge the updated occ
                            nodes.occurrence.merge(a_entityDef.occs, l_occ, a_newData.occs[i]);

                            if (l_new)
                            {
                                a_newData.occs[i] = l_occ;
                            }
                            if (_ufd.getOccStatus(l_occ) === "mod" || _ufd.getOccStatus(l_occ) === "new") {
                                // Mark the occurrence as 'modified on server'.
                                _ufd.setOccMod(l_occ, "server");
                            }
                        }
                    }
                }

                if (l_append)
                {   // 3b. Append current set with new occs
                    for (i = 0; i< a_newData.occs.length; i++)
                    {
                        l_occ = a_newData.occs[i];
                        if (_ufd.getOccStatus(l_occ) === "empty")
                        {
                            a_oldData.complete = true;
                        }
                        else
                        {
                            // append new occ at the end
                            _ufd.setOccDirty(l_occ, true);
                            a_oldData.occs.push(l_occ);
                        }
                    }
                }

                // 4. Mark remaining old as invalid (they were deleted on back-end!)
                if (l_new)
                {   // only full new page
                    // The indexes that are, at this stage, still in the old index list
                    // denote occurrences that were in scope but for which
                    // no new data was received.  They were deleted, so to speak.
                    // Therefore they are marked as invalid here.
                    for (i in l_oldIdx) if (l_oldIdx.hasOwnProperty(i)) {
                        _ufd.invalidateOcc(a_entityDef.occs, l_oldIdx[i]);
                    }
                }
            } //if(true && a_scope.b)
            else
            {
                var l_emptyOcc = null;

                if (a_scope === undefined)
                {
                    a_scope = {};
                }
                if (a_scope.occs === undefined)
                {
                    a_scope.occs = {};
                }

                // 1. Build index
                for (i = 0; i< a_oldData.occs.length; i++)
                {
                    l_oldIdx[_ufd.getOccId(a_oldData.occs[i])] = a_oldData.occs[i];
                    l_oldOccs[i].inScope = false;
                    _ufd.setOccDirty(a_oldData.occs[i], false);
                }

                // 2. Mark
                for (i in a_scope.occs)
                {
                    if (a_scope.occs.hasOwnProperty(i))
                    {
                        if (l_oldIdx[i])
                        {
                            l_oldIdx[i].inScope = a_scope.occs[i].b;
                        }
                    }
                }

                // 3. Overlay new or add new
                for (i = 0; i< a_newData.occs.length; i++)
                {
                    var l_occid = _ufd.realOccId(a_newData.occs[i]);
                    if (l_oldIdx[l_occid] === undefined)
                    {
                        if (_ufd.getOccStatus(a_newData.occs[i]) === "empty")
                        {
                            l_emptyOcc = a_newData.occs[i];
                        }
                        else
                        {
                            // New occ: add it
                            a_oldData.occs.push(a_newData.occs[i]);
                            _ufd.setOccDirty(a_newData.occs[i], true);
                        }
                    }
                    else
                    {   // Overlay
                        _ufd.setOccDirty(l_oldIdx[l_occid], true);
                        nodes.occurrence.merge(a_entityDef.occs, l_oldIdx[l_occid], a_newData.occs[i], a_scope.occs[l_occid]);
                    }
                }

                // 4. Remove marked occs
                var l_isEmpty = true;
                for ( i = a_oldData.occs.length -1; i >=0; i--)
                {
                    if (a_oldData.occs[i].inScope)
                    {
                        _ufd.invalidateOcc(a_entityDef.occs, a_oldData.occs[i]);
                        a_oldData.occs.splice(i,1);
                    }
                    else
                    {
                        if (_ufd.getOccStatus(a_oldData.occs[i]) !== "del")
                        {
                            l_isEmpty = false;
                        }
                        else
                        {
                            _ufd.invalidateOcc(a_entityDef.occs, a_oldData.occs[i]);
                        }
                    }
                }

                // Check and add the  empty occurrence
                if (l_isEmpty && l_emptyOcc !== null)
                {
                    a_oldData.occs.push(l_emptyOcc);
                }
            }
        }
    },

    occurrence : {
        serialize: function(a_realizedOcc, a_occDef, a_occData, a_scope, a_currentPath, r_ccyInScope, a_justCheck, a_includeEmpty )
        {
            var l_serialized = {}, l_child, l_childName, l_occAtrib;
            var l_jsonCreated = false;

            for (l_child in a_occDef) if (a_occDef.hasOwnProperty(l_child))
            {
                if (typeof a_occDef[l_child].type === "string")
                {
                    l_childName = a_occDef[l_child].nm;

                    var l_fldDef = a_occDef[l_child],
                        l_occData = null;

                    if (a_occData && (_ufd.getOccChild(a_occData, l_child) !== undefined) )
                    {
                        l_occData = _ufd.getOccChild(a_occData, l_child);
                        var l_occStruct = null;
                        if (a_realizedOcc)
                        {
                            l_occStruct = a_realizedOcc.getChild(l_child);
                        }

                        var l_childScope = checkChildInScope(l_occStruct, a_occDef[l_child], l_occData, a_scope);
                        if (l_childScope.match)
                        {
                            var l_serializedChild = nodes[l_fldDef.type].serialize(l_occStruct, l_fldDef, l_occData, l_childScope.scope, a_currentPath, r_ccyInScope, a_justCheck, a_includeEmpty);
                            if (l_serializedChild !== undefined)
                            {
                                l_serialized[l_child] = l_serializedChild;
                                l_jsonCreated = true;   //flag to mark if one of the child has json created
                            }
                        }
                    }
                }
            }

            if (a_justCheck)
            {
                return;
            }

            if (a_occData)
            {
                l_occAtrib = _ufd.serializeOccAttributes(a_occData, l_serialized);
            }
            _ufd.serializeOccStatus(a_occData, l_serialized);

            // HTML optimization : send l_serialized only if either there is an attribute change or one of the child has some changes
            // For DSPs its always true
            if (l_occAtrib || l_jsonCreated)
            {
                return l_serialized;
            }
            else
            {
                return undefined;
            }
        },

        blockScope : function(a_realizedOcc, a_occDef, a_occData, a_scope, a_currentPath )
        {
            var l_blockList = {}, l_child,l_childName,
                l_blockThis = a_scope === undefined || (a_scope.fields !== undefined && a_scope.fields.length >0 );

            if (l_blockThis)
            {
                // Increase block
                _ufd.incOccBlock(a_occData);
            }

            for (l_child in a_occDef) if (a_occDef.hasOwnProperty(l_child))
            {
                if (typeof a_occDef[l_child].type === "string")
                {
                    l_childName = a_occDef[l_child].nm;

                    var l_fldDef = a_occDef[l_child],
                        l_occData = null;

                    if (a_occData && (typeof _ufd.getOccChild(a_occData, l_child) != "undefined") )
                    {
                        l_occData = _ufd.getOccChild(a_occData, l_child);
                        var l_occStruct = null;
                        if (a_realizedOcc)
                        {
                            l_occStruct = a_realizedOcc.getChild(l_child);
                        }

                        var l_childScope = checkChildInScope(l_occStruct, a_occDef[l_child], l_occData, a_scope);

                        if (l_childScope.match)
                        {

                            var l_blockedScope = nodes[l_fldDef.type].blockScope(l_occStruct, l_fldDef, l_occData, l_childScope.scope, a_currentPath);
                            if (l_blockedScope !== undefined)
                            {
                                l_blockList[l_child] = l_blockedScope;
                            }
                        }
                    }
                }
            }
            return { occ: a_occData, vocc: a_realizedOcc, c: l_blockList, b: (l_blockThis)};
        },

        /* Scope: array of selector + extra layer
         */
        checkScope : function(a_realizedOcc, a_occDef, a_occData, a_scope, a_currentPath )
        {
            var l_blockList = {}, l_child, l_childName,

            // This occurrence itself must be blocked if either:
            //  - the occurrence itself is a leave node in the scope
            //  - we have (some) fields of this occurrence
                l_blockThis = a_scope === undefined || (a_scope.fields !== undefined && a_scope.fields.length >0 );

            if (l_blockThis && _ufd.isOccBlocked(a_occData) )
            {
                return true;
            }

            for (l_child in a_occDef) if (a_occDef.hasOwnProperty(l_child))
            {
                if (typeof a_occDef[l_child].type === "string")
                {
                    l_childName = a_occDef[l_child].nm;

                    var l_fldDef = a_occDef[l_child],
                        l_occData = null;

                    if (a_occData && (_ufd.getOccChild(a_occData, l_child) !== undefined) )
                    {
                        l_occData = _ufd.getOccChild(a_occData, l_child);
                        var l_occStruct = null;
                        if (a_realizedOcc)
                        {
                            l_occStruct = a_realizedOcc.getChild(l_child);
                        }

                        var l_childScope = checkChildInScope(l_occStruct, a_occDef[l_child], l_occData, l_blockThis ? undefined : a_scope);

                        if (l_childScope.match)
                        {
                            if (nodes[l_fldDef.type].checkScope(l_occStruct,  l_fldDef, l_occData, l_childScope.scope, a_currentPath))
                            {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        },

        unblockScope : function(a_outScope)
        {
            if (a_outScope.b)
            {
                _ufd.decOccBlock(a_outScope.occ);
            }

            var l_child;
            for (l_child in a_outScope.c) if (a_outScope.c.hasOwnProperty(l_child))
            {
                nodes[a_outScope.c[l_child].def.type].unblockScope (a_outScope.c[l_child]);
            }
        },

        merge: function( a_occDef, a_oldData, a_newData, a_scope )
        {
            a_oldData.normalizedProps = _uf.scope.mergeProps(a_oldData[1], a_newData[1], a_oldData.normalizedProps);

            if (a_scope === undefined)
            {
                a_scope = {};
            }

            var l_child;
            _ufd.copyOccAttributes(a_oldData, a_newData);

            for (l_child in a_occDef) if (a_occDef.hasOwnProperty(l_child))
            {
                if (typeof a_occDef[l_child].type === "string")
                {
                    var l_fldDef = a_occDef[l_child];

                    var l_newData = _ufd.getOccChild(a_newData, l_child);
                    var l_oldData = _ufd.getOccChild(a_oldData, l_child);

                    if ( l_newData === undefined)
                    {
                        if (l_oldData !== undefined)
                        {
                            l_oldData.dirty = false;
                        }
                    }
                    else
                    {
                        var l_scope;
                        l_scope = a_scope.c === undefined ? undefined : a_scope.c[l_child];
                        nodes[l_fldDef.type].merge( l_fldDef, l_oldData, l_newData, l_scope);
                        if (l_oldData !== undefined)
                        {
                            l_oldData.dirty = true;
                        }
                    }
                }
            }
        }
    },

    field : {
        serialize: function(a_realizedField, a_fldDef, a_fldData, a_scope, a_currentPath, a_ccy, a_justCheck )
        {
            var lData = a_fldDef;

            if (a_fldData) {
                lData = a_fldData;
            }

            var lVal = null;

            if (!a_realizedField || !a_realizedField.isModified() ) {
                lVal = lData.value;
            } else {
                var checkedValue = a_realizedField.checkedValue();

                // Aggregate all the errors in the nodes.errors array (see RequestScope.execute method)
                if ( checkedValue.error && a_realizedField.syntaxCheckEnabled()) {
                    _uf.scope.nodes.errors.push(checkedValue.error);
                }
                
                // Suppress the OnSyntaxError trigger, allow the custom widget error to function.
                a_realizedField.handleError(checkedValue, true, false);
                lVal = checkedValue.normalizedValue;
            }

            if (a_justCheck || lData.isUntouched)
            {
                return;
            }
            delete lData.isUntouched;

            var JSON = {value : lVal};

            if (lData.hash)
            {
                JSON.hash = lData.hash;
            }
            _ufd.clearFldMod(lData);

            return JSON;
        },

        blockScope : function(a_realizedField, a_fldDef, a_fldData, a_scope, a_currentPath )
        {
            if (a_realizedField != null && !a_fldData.block ) // pragma(allow-loose-compare)
            {
                a_realizedField.showBlock();
            }
            a_fldData.block = a_fldData.block ? a_fldData.block+1 : 1;
            return { rel : a_realizedField, def : a_fldDef, dat : a_fldData, b:true };
        },

        checkScope : function(a_realizedField, a_fldDef, a_fldData, a_scope, a_currentPath )
        {
        },

        unblockScope : function(a_outScope )
        {
            a_outScope.dat.block = a_outScope.dat.block ? a_outScope.dat.block-1 : 0;
            if (a_outScope.rel != null  && a_outScope.dat.block === 0) // pragma(allow-loose-compare)
            {
                a_outScope.rel.showUnblock();
            }
        },

        merge : function( a_fieldDef, a_oldData, a_newData, a_scope )
        {
            a_oldData.normalizedProps = _uf.scope.mergeProps(a_oldData, a_newData, a_oldData.normalizedProps);

            if ( a_newData.valrep !== undefined ) {
                a_oldData.valrep = a_newData.valrep;
            }

            //a_oldData[l_child]=l_newData;
            if (a_newData.value !== undefined)
            {
                a_oldData.value = a_newData.value;
                a_oldData.hash = a_newData.hash;
            }
            a_oldData.resource = a_newData.resource;
        }
    },

    label : {
        serialize: nop,
        blockScope : nop,
        checkScope : nop,
        unblockScope : nop
    },

    instance : {
        serialize: function(a_instance, a_compDef, a_instData, a_scope, a_currentPath, r_ccyInScope, a_justCheck, a_includeEmpty )
        {
            if (a_compDef && a_instData) {
                var l_serialized = {},
                    tmpJson = nodes.occurrence.serialize(a_instance.getStructureMap()[0], a_compDef, a_instData, a_scope.input, a_currentPath, r_ccyInScope, a_justCheck, a_includeEmpty) || {},
                    l_occ = [null, tmpJson];
                l_serialized[a_instance.instanceName] = l_occ;
                l_serialized[a_instance.instanceName].scope = a_scope.scopeName;
                if (!a_justCheck) {
                    return { "newdata": l_serialized };
                }
            }
        },

        blockScope : function(a_instance, a_compDef, a_instData, a_scope, a_currentPath )
        {
            if (a_instance.getStructureMap()[0])
            {
                return { b: false, inst: a_instance, occ : nodes.occurrence.blockScope(a_instance.getStructureMap()[0], a_compDef, a_instData,  a_scope.output, a_currentPath)};
            }
            else
            {
                a_instance.block = a_instance.block ? a_instance.block+1 : 1;
                return { b: true, inst: a_instance, occ: undefined };
            }
        },

        checkScope : function(a_instance, a_compDef, a_instData, a_scope, a_currentPath )
        {
            if (a_instance.block > 0)
            {   // Instance blocked: no  dice
                return true;
            }
            else if (a_instance.definition && a_instance.data)
            {   // Loaded -> check scope
                return nodes.occurrence.checkScope(a_instance.getStructureMap()[0], a_compDef, a_instData, mergeScope(a_scope.input, a_scope.output), a_currentPath);
            }
            else
            {   // Not loaded yet, no input expected -> the request is allowed
                return !isEmptyScope(a_scope.input);
            }
        },

        unblockScope : function(a_outScope)
        {
            if (a_outScope !==  undefined)
            {
                if (a_outScope.occ !== undefined)
                {
                    nodes.occurrence.unblockScope(a_outScope.occ);
                }
                if (a_outScope.b)
                {
                    a_outScope.inst.block = a_outScope.inst.block ? a_outScope.inst.block-1 : 0;
                }
            }
            else
            {
                UNIFACE.trace("Unblocking Undefined");
            }
        }
    }
}; // nodes


    /**
     *
     * @type {{entity: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function, merge: Function, mergeOccs: Function}, occurrence: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function, merge: Function}, field: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function, merge: Function}, label: {serialize: *, blockScope: *, checkScope: *, unblockScope: *}, instance: {serialize: Function, blockScope: Function, checkScope: Function, unblockScope: Function}}}
     */
_uf.scope.nodes = nodes;

})(_uf.ui, _uf.transp, _uf.data, _uf.commands, _uf.InstanceManager);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/



/*global UNIFACE JSON _uf uf_clientside uniface Promise initialRequestScope mergeScope isEmptyScope*/


(function (_uf_ui, _uf_tr, _ufd, _ufc, _uf_instance_manager) {
    "use strict";


    /**
     * //TODOC
     * getCallId
     * @param aInstName
     * @param aModuleName
     * @param aDefName
     * @returns {string}
     */
    function getCallId(aInstName, aModuleName, aDefName) {
        aModuleName = aModuleName.toLowerCase();
        return ((typeof aDefName === "string" && aDefName !== "" ) ? (aDefName + "@") : "") + aInstName + "." + aModuleName;
    };




    /**
     * //TODOC
     * @param anObject
     */
    function clone(anObject) {
        return JSON.parse( JSON.stringify( anObject ) );
    }


    /**
     * //TODOC
     * @param aResult
     * @param aCallback
     * @param aScopeMap
     */
    function applyCallbackResult(aResult, aCallback, aScopeMap) {
        if ( typeof aResult === "string" ) {
            aResult = [aResult];
        } else if ( !(aResult instanceof Array) ) {
            aResult = [];
        }

        aCallback.result = aResult;
        var l_id, j;
        for (l_id in aCallback.targets) if (aCallback.targets.hasOwnProperty(l_id)) {
            var oper = aCallback.targets[l_id];
            if ( oper ) {
                var include = aScopeMap[l_id].include;
                for (j=0; j<aResult.length; j++) {
                    include.push({
                        inst : aResult[j],
                        oper : oper
                    });
                }
                aCallback.targets[l_id] = false;
            }
        }
    }






/**
 * Constructor for RequestScope object
 * The request scope object encapsulates a request with its context and scope.
 * It can be queued (e.g. put on the blockedCommands list) or executed dirtectrly.
 *
 * @param a_realizedObject
 * @param a_moduleName
 * @param a_moduleType
 * @param a_moduleArgs
 * @param a_requestArgs
 * @param a_id
 * @constructor
 */
function RequestScope(a_realizedObject, a_moduleName, a_moduleType, a_moduleArgs, a_requestArgs, a_id)
{
    this.args = a_requestArgs;
    this.moduleName = a_moduleName.toLowerCase();
    this.moduleType = a_moduleType.toLowerCase();
    this.moduleArgs = a_moduleArgs;
    this.instance = a_realizedObject.instance ? a_realizedObject.instance : a_realizedObject;
    this.realizedObject = a_realizedObject;
    this.data = a_realizedObject.data;
    this.scope = undefined;
    this.outscope=undefined;
    this.id = a_id;

    this.dynScopeMap = { length : 0 };

    this.initByDef();
    var me = this;

    // Do not implement a catch block for this promise since the calling API needs to catch any exception generated.
    this.promise = new Promise(function(resolve, reject) { me.resolve = resolve; me.reject = reject;  }).
        then(function (a) {
            if (me.requestType == "clientside") {
                return { returnValue: a };
            }
            else {
                return a;
            }
        });
}


    /**
     *
     * @type {{_getUserFunction: Function, initByDef: Function, isCallable: Function, unBlock: Function, visitScopeInstances: Function, serialize: Function, traverseScopes: Function, isBlockedByCallback: Function, checkAndBlock: Function, checkInstance: Function, execute: Function}}
     */
RequestScope.prototype =   {


    _getUserFunction: function (a_userObject, a_instance, a_api)
    {
        var func, userFunc, apiObject, args;
        /* @c28478 this.defName only valid for field trigger */
        if (a_userObject && a_userObject[a_instance.componentName] )
        {
            if (this.moduleType === 't' && this.defName && a_userObject[a_instance.componentName][this.defName])
            {
                userFunc = a_userObject[a_instance.componentName][this.defName][this.moduleName];
                apiObject = this.realizedObject.getAPIObject();
            }
            else if (this.moduleType === 'o')
            {
                userFunc = a_userObject[a_instance.componentName][this.moduleName];
                apiObject = a_api.getInstance(a_instance.instanceName);
            }
        }
        if (typeof userFunc === "function") {
            // Wrap the user-defined function with a try-catch block,
            // to show an alert if the user-defined JavaScript throws an uncaught exception.
            args = this.moduleArgs; // These are the arguments for the user-defined function.
            func = function(resolve, reject) {
                try {
                    var l_rv = userFunc.apply(apiObject, args);
                    resolve(l_rv);
                    return l_rv;
                } catch (e) {
                    reject(e);
                    if (e instanceof a_api.DataAddressingException) {
                        UNIFACE.extension.popupWindow.showMessage(e, "OK", "UNIFACE DataAddressingException", 400, 0, "error");
                        //alert(e);
                    } else {
                        UNIFACE.extension.popupWindow.showMessage(e, "OK", "Exception", 400, 0, "error");
                    }
                }

            };
            // This is, evidently, a client-side trigger or operation.
            this.requestType = "clientside";
        }
        return func;
    },

    initByDef : function() {
        this.definition = this.realizedObject.definition;

        var l_moduleList={exec: initialRequestScope};

        if (this.definition)
        {
            l_moduleList = this.moduleType == "t" ? this.definition.triggers : this.definition.operations;
        }
        else if ( this.args["u:dspmode"] === "embed" )
        {
            l_moduleList[this.moduleName] = initialRequestScope;
            this.instance._pendingCreate = true;
        }
        else if ( typeof this.moduleName  === "string" && this.instance && this.instance._pendingCreate )
        {
            l_moduleList[this.moduleName] = {requesttype : "delayed", input:[]};
            this.instance.delayedScope = this;
        }

        if (l_moduleList!==undefined )
        {
            this.scope = l_moduleList[this.moduleName ];
        }
        if (this.args.scope)
        {
            this.scope = this.args.scope;
        }
        this.defName = "";
        if (this.definition && this.definition.nm)
        {
            this.defName = this.definition.nm;
        }

        this.requestType = "update";
        if (this.scope && this.scope.requesttype !== undefined)
        {
            this.requestType = this.scope.requesttype ;
        }

        if ( this.args["u:dynRequest"] ) {
            this.dynRequest = this.args["u:dynRequest"];
        }
        this.callbackMap = null;
    },

    isCallable : function()
    {
        return this.scope !== undefined && _uf_tr.is_callable(this.requestType);
    },

    unBlock: function()
    {
        var i;
        if ( this.callbackMap ) {
            RequestScope.inDynamicBlock = false;
            //this.callbackMap = null;
        }

        if ( this.requestType === "delayed" && this.instance.definition ) {
            this.initByDef();
            this.instance.delayedScope = undefined;
        }
        for (i in this.outScope) if (this.outScope.hasOwnProperty(i) && this.outScope[i]!==undefined)
        {
            _uf.scope.nodes.instance.unblockScope(this.outScope[i]);
            //nodes.instance.unblockScope(this.outScope[i]);
        }
    },


    /*
     Iterate the structure created by the traverseScopes() function.
     call a function for each instance + associated input/ouput scope of the instance
     Used by
     */
    visitScopeInstances : function(a_fn, r_ccyInScope)
    {
        var i;
        for (i in this.compScopes) if (this.compScopes.hasOwnProperty(i))
        {
            // Get the instance
            var l_inst = _uf_instance_manager.getInstance(i);
            if (l_inst === undefined)
            {
                UNIFACE.throwException("Component instance " + i + " does not exist!");
            }
            var l_path = undefined;
            var l_ccyInScope = undefined;
            if (i == this.instance.instanceName)
            {
                l_path = this.currency;
                l_ccyInScope = r_ccyInScope;
            }

            var l_res = a_fn(l_inst, l_inst.definition, l_inst.data, this.compScopes[i], l_path, l_ccyInScope);
            if (!!!l_res)
            {
                return;
            }
        }
    },

    serialize: function(aJsonData, justCheck)
    {
        var ccy = [];
        this.visitScopeInstances(function(a_inst, a_def, a_data, a_scope, a_path, a_ccyInScope){
            aJsonData[a_inst.instanceName] = _uf.scope.nodes.instance.serialize.call(this,
                a_inst, a_def, a_data, a_scope, a_path, a_ccyInScope, justCheck);
            return true;
        }, ccy);
        return ccy;
    },

    /*
     Traverse the chain(s) of included scopes (e.g. using the 'operation' keyword in a scope declaration) and
     create a list of input/output scopes for each relevant instance
     Error conditions:
     - operation does not exist
     - more than one input or output scope for the same instance

     Special condition:
     - instance not loaded yet: this can only mean the whole instance is in scope and already blocked.
     The queueing mechanism is used to postpone the request, after which this function is called again to
     determine the proper scope.
     This condition is signaled by having the instance name in the list with a scope of 'undefined'

     */
    traverseScopes : function() {
        var l_scopes = {};
        var l_operations = { };
        var l_callbackMap = this.callbackMap;
        var l_scopeMap = this.dynScopeMap;
        var l_callback, j;  // temp vars in addScope();
        var l_scope = this;

        function l_addScope(_a_instanceName, _a_scope, _a_moduleName, _a_realizedObject, _a_moduleType, _a_defName)
        {
            var _l_scopeId = getCallId(_a_instanceName, _a_moduleName, _a_defName);

            if ( l_scopeMap[_l_scopeId] ) {
                _a_scope = l_scopeMap[_l_scopeId];
            }

            if (l_scopes[_a_instanceName] === undefined)
            {
                // Default empty, add to it later
                l_scopes[_a_instanceName] = { input: {entities:[]}, output: {entities:[]} };
            }

            if (_a_scope === undefined)
            {
                l_scopes[_a_instanceName].input = mergeScope(l_scopes[_a_instanceName].input, undefined);
                l_scopes[_a_instanceName].output = mergeScope(l_scopes[_a_instanceName].output, undefined);
            }
            else
            {
                l_scopes[_a_instanceName].input = mergeScope(l_scopes[_a_instanceName].input, _a_scope.input);
                l_scopes[_a_instanceName].output = mergeScope(l_scopes[_a_instanceName].output, _a_scope.output);

                var _l_includedOps = _a_scope.include == null ? [] : _a_scope.include; // pragma(allow-loose-compare)
                _l_includedOps = _l_includedOps.concat([]); // Clone

                if (!_a_realizedObject) {
                    // If the instance doesn't exist, create it so it can be blocked while we wait for it to be actually created...
                    _a_realizedObject = _uf_instance_manager.makeInstance(_a_instanceName);
                    _a_moduleType = "o";
                }

                var _l_includedOps2 = [];

                var i;
                for (i=0; i< _l_includedOps.length; i++) {
                    if ( _l_includedOps[i].callback ) {
                        if ( !l_scopeMap[_l_scopeId] ) {
                            l_scopeMap[_l_scopeId] = clone(_a_scope);
                            _a_scope = l_scopeMap[_l_scopeId];
                            _a_scope.include = _l_includedOps2;
                        }

                        var _l_callbackId = getCallId(_a_instanceName, _l_includedOps[i].callback, _a_defName);

                        if ( !l_callbackMap ) {
                            l_callbackMap = {};
                        }
                        if ( !l_callbackMap[_l_callbackId] ) {
                            l_callbackMap[_l_callbackId] = {
                                result: null,
                                object  : _a_realizedObject,
                                name    : _l_includedOps[i].callback,
                                type    : _a_moduleType,
                                targets : {}
                            };
                            l_scope.callbackChanged = true;
                        }

                        l_callback = l_callbackMap[_l_callbackId];
                        if ( l_callback.result ) {
                            for (j=0; j<l_callback.result.length; j++) {
                                var l_instOper = {
                                    inst : l_callback.result[j],
                                    oper : _l_includedOps[i].oper
                                };
                                _l_includedOps.push(l_instOper);
                                _l_includedOps2.push(l_instOper);
                            }
                            if ( l_callback.targets[_l_scopeId] ) {
                                l_callback.targets[_l_scopeId]=false;
                            }
                        } else if ( !l_callback.targets[_l_scopeId] ) {
                            l_callback.targets[_l_scopeId] = _l_includedOps[i].oper ;
                            l_scope.callbackChanged = true;
                        }

                        continue;
                    } //if callback

                    _l_includedOps2.push(_l_includedOps[i]);


                    // Guard against loops in the import graph
                    var _l_fqn = _l_includedOps[i].inst + "." + _l_includedOps[i].oper;
                    if ( l_operations[_l_fqn] ===undefined )
                    {
                        var _l_existingScope = l_scopes[_l_includedOps[i].inst];
                        l_operations[_l_fqn] = true;
                        // 1. Get component
                        var _l_inst = _uf_instance_manager.getInstance(_l_includedOps[i].inst);
                        var _l_operScope; //, l_dynOperScope;
                        if (_l_inst !== undefined && _l_inst.definition !== undefined)
                        {
                            // 2. get operation scope
                            if (_l_inst.definition.operations !== undefined)
                            {
                                _l_operScope = _l_inst.definition.operations[_l_includedOps[i].oper];
                            }
                            if (_l_operScope === undefined)
                            {
                                UNIFACE.throwException("Error: instance \"" + _l_includedOps[i].inst + "\" does not have an operation \"" + _l_includedOps[i].oper + "\"");
                            }
                            _l_operScope.scopeName = "operation " + _l_fqn;

                            if (_l_existingScope !== undefined)
                            {
                                if (!isEmptyScope(_l_existingScope.input) && !isEmptyScope(_l_operScope.input))
                                {
                                    UNIFACE.throwException("Error: instance " + _l_includedOps[i].inst + " is included multiple times with different input scope.");
                                }
                                if (!isEmptyScope(_l_existingScope.output) && !isEmptyScope(_l_operScope.output))
                                {
                                    UNIFACE.throwException("Error: instance " + _l_includedOps[i].inst + " is included multiple times with different output scope.");
                                }
                            }
                        }
                        else
                        {
                            _l_operScope = initialRequestScope;
                        }
                        l_addScope(_l_includedOps[i].inst, _l_operScope, _l_includedOps[i].oper);
                    } // if ( l_operations[_l_fqn] ===undefined )
                } // for (i=0 ...)
            } // if (_a_scope === undefined) else
        } // function l_addScope

        l_scope.callbackChanged = false;

        l_addScope(this.instance.instanceName, this.scope, this.moduleName, this.realizedObject, this.moduleType, this.defName);

        if ( l_callbackMap) {
            this.callbackMap = l_callbackMap;
        }

        return l_scopes;
    },

    isBlockedByCallback : function(a_hasChanged) {
        if ( RequestScope.inDynamicBlock && !this.dynRequest && a_hasChanged) {
            return true;
        }

        var l_callbackMap = this.callbackMap;
        var l_callback;
        if ( l_callbackMap ) {
            for (l_callback in l_callbackMap) if ( l_callbackMap.hasOwnProperty(l_callback) ) {
                if ( !l_callbackMap[l_callback].result ) {
                    return true;
                }
            }
        }

        return false;
    },

    checkAndBlock: function()
    {
        var l_blocked = false;
        var me = this;
        if ( this.scope)
        {
            if ( this.scope.requesttype === "delayed" )
            {
                l_blocked = true;
            }
            else
            {
                var l_scopes = this.traverseScopes();
                if ( this.isBlockedByCallback(this.callbackChanged) ) {
                    if ( this.callbackMap ) {
                        if ( !RequestScope.inDynamicBlock ) {
                            RequestScope.inDynamicBlock = true;
                        }
                        return true;
                    }

                    var name;
                    for (name in l_scopes) if ( l_scopes.hasOwnProperty(name) ) {
                        return true; // Block only the non-empty scope
                    }
                }

                this.compScopes = l_scopes;
                this.compScopes[this.instance.instanceName].scopeName = this.moduleType + " " + this.moduleName + this.componentName ? "." + this.componentName : "";

                this.currency = null;
                if (this.realizedObject.getCurrency)
                {
                    this.currency = this.realizedObject.getCurrency();
                }

                // 1. Check
                l_blocked =  (this.realizedObject.instance === this.realizedObject) ?
                    this.realizedObject.block : (this.realizedObject.data && this.realizedObject.data.block) ;
                if (!l_blocked)
                {
                    this.visitScopeInstances(function(){
                        l_blocked = l_blocked || _uf.scope.nodes.instance.checkScope.apply(this, arguments);
                        return !l_blocked;
                    });
                }

                // 2. Block (again)
                this.outScope = {};

                this.visitScopeInstances(function(a_inst){
                    me.outScope[a_inst.instanceName] = _uf.scope.nodes.instance.blockScope.apply(this, arguments);
                    return true;
                });
            }
        }

        return l_blocked;
    },

    checkInstance: function()
    {
        // Check if realized instance still attached to  luv && pointing to same data
        return ( this.realizedObject && this.realizedObject.instance === this.realizedObject &&
            !this.realizedObject.isInvalid ) ||
            (this.data === this.realizedObject.data);
    },

    execute: function()
    {
        // 1. Collect data
		var l_url, jsonData, userFunc, arg;

        if (this.scope === undefined)
        {
            return;
        }

        var l_glob = window,
            l_instance = this.instance,
            l_localInstance;
        if (l_instance.views && l_instance.views.length) {
            l_localInstance = l_instance;
        }
        else {
			l_localInstance = _uf_instance_manager.getInstance(this.instance.instanceName);
        }
        if (l_localInstance.views && l_localInstance.views.length) {
            l_glob = l_localInstance.views[0].global;
            l_instance = l_localInstance.views[0].remoteInstance;
        }
        if (this.args["u:dspmode"] !== "embed")
        {
            userFunc = this._getUserFunction(l_glob.uf_clientside, l_instance, l_glob.uniface);
            if (!userFunc)
            {
                userFunc = this._getUserFunction(l_glob._uf_clientside, l_instance, l_glob.uniface);
            }
        }

        // 2. Execute the trigger

		// 2.1. Determine the url
		l_url = uniface && uniface.wrdurl;
		if (!l_url) {
			l_url = document.location.pathname;
			l_url = l_url.substring(0, l_url.lastIndexOf('/') + 1); // "/uniface/wrd/run", or empty string if no "/"
			if (l_url.charAt(0) !== '/') {
				// URL must start with a '/', otherwise it won't work when
				// using the DSP from a window.showModalDialog on IE7 and IE8.
				l_url = "/" + l_url;
			}
		}
		if (!/\/$/.test(l_url)){
			l_url += '/';
		}
		l_url += this.instance.componentName;



        // 2.2. Validate the data.
        //      Validation may result in an exception.if
        //      This exception is caught here, after which the
        //      the unBlock method of the request is called,
        //      to prevent that data will stay blocked.

        jsonData = {};
        var l_validCcy;
		var l_discontinue = false;
		var l_rejectionErrors = [];
		_uf.scope.nodes.errors = [];
        try {
            l_validCcy = this.serialize(jsonData, !!userFunc);
			if (_uf.scope.nodes.errors.length > 0) {
				l_discontinue = true;
				l_rejectionErrors = _uf.scope.nodes.errors;
			}
        } catch (e) {
            UNIFACE.trace(e);
			l_discontinue = true;
			l_rejectionErrors[l_rejectionErrors.length] = e;
		}
		
		if (l_discontinue) {
            // We're will break off this whole request.
            // Therefore we must unblock first.
            this.unBlock();
            // ... and then discontinue the current request:
            // ALEX: The following line needs review with Thomas. Do we need to reject the promise?
            // If we don't I get UDOH errors (e.g. WIDGETS1)
            // What do we need to do with the rejection errors?
            this.reject(l_rejectionErrors);

            _ufc.run();
            return;
        }

        var l_returnValue;
        if (!_uf_tr.is_remote(this.requestType)) {
            try {
                if (userFunc) {
                    l_returnValue = userFunc(this.resolve, this.reject);
                }
                else {
                    this.reject(new
                        uniface.ModuleNotFound(this.moduleName, this.moduleType, this.defName, this.instance.componentName));
                }
                if ( this.dynRequest && this.dynRequest.callbackMap ) {
                    var l_callId = getCallId(this.instance.instanceName, this.moduleName, this.defName);
                    var l_callback = this.dynRequest.callbackMap[l_callId];
                    if (l_callback) {
                        applyCallbackResult(l_returnValue, l_callback, this.dynRequest.dynScopeMap);
                    }
                }
            } finally {
                // We will break off this request.
                // Therefore we must unblock first.
                this.unBlock();
            }

            _ufc.run();
            // ... and then discontinue the current request:
            return;
        }

        // 2.3. Create the request.
        var l_req = _uf_tr.createRequest(this.requestType);
        l_req.instance = this.instance;
        l_req.scope = this;
        l_req.id = this.id;

        // 2.4. Add all kinds of attributes/parameters to the request.
        var l_in;
        for (l_in in jsonData) if (jsonData.hasOwnProperty(l_in))
        {
            if (jsonData[l_in] !== undefined)
            {
                l_req.addBodyPart("data:" + l_in.toUpperCase(), JSON.stringify(jsonData[l_in]));
            }
        }
		l_req.setURL(l_url);
        if (this.moduleName !== "exec")
        {
            l_req.setOperation( this.moduleName, true);
            l_req.addParam("u:moduletype", this.moduleType);
        }

        if (this.defName)
        {
            l_req.addParam("u:fieldname", this.defName);
        }

        var i;
        for (i = 0; i < l_validCcy.length; i++)
        {
            if (_ufd.getOccStatus(l_validCcy[i].data)!=="empty")
            {
                l_req.addParam("u:entity." + this.instance.instanceName + "." +i, l_validCcy[i].entity.definition.nm);
                l_req.addParam("u:occid."+ this.instance.instanceName + "." +i, _ufd.getOccId(l_validCcy[i].data));
            }
        }
        for ( var param in this.args ) if ( this.args.hasOwnProperty(param) ) {
            l_req.addParam(param, this.args[param]);
        }
        if ( this.instance.componentName && this.instance.instanceName != this.instance.componentName )
        {
            l_req.addParam("u:insname", this.instance.instanceName );
        }
        if (this.args["u:dspmode"] === "embed")
        {
            l_req.requestType =  "static";
            l_req.responseType =  "update";
            l_req._pendingCreate = true;
        }
        // Supply operation parameters (as strings) as request parameters named u:arg.<argumentNumber>.
        for (i = 0; i < this.moduleArgs.length; i++) {
            arg = this.moduleArgs[i];
            if (arg === undefined || arg === null) {
                arg = "";
            }
            l_req.addParam("u:arg."+(i+1), "" + arg);
        }

        var l_iStr="";
        var l_inst;
        _uf_instance_manager.some(function (a_inst) {
            if (a_inst.definition !== undefined) {
                l_iStr += a_inst.instanceName.replace(";", "_") + ";";
            }
        });
        l_req.addParam("u:definedInstances", l_iStr);
        this.resolve(l_req.send());
    } // execute

}; // RequestScope.prototype


    /**
     *
     * @type {RequestScope}
     */
_uf.scope.RequestScope = RequestScope;


})(_uf.ui, _uf.transp, _uf.data, _uf.commands, _uf.InstanceManager);/* %fv: uscope.js-82.1.1:ascii:1 % %dc: Wed Jul 15 14:25:26 2015 %*/
/*global UNIFACE JSON _uf uf_clientside uniface */
(function (_uf_ui, _uf_tr, _ufd, _ufc, _uf_instance_manager) {
    "use strict";


/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
090717 c27474    9401c1  mzu Split from udatalayer.
100910 c28478    950101  ahn correction for clientside operation search
101027 t99504    950101  jnz RIA: API internal operations
140319 c30047    10.1.01 sse Change nodes.entity.merge for paginated data
140703 c30208    1010101 tsk HTML Form: send entity properties even if occurrences haven't changed
date   refnum    version who description
*******************************************************************************/

/// <reference path="ubase.js" />
/// <reference path="uprops.js" />
/// <reference path="udata.js" />
/// <reference path="uluv.js" />






    /**
     * //TODOC
     * @param a_instance
     * @param a_data
     * @param req
     */
function renderView(a_instance, a_data, req)
{
    if (a_instance) {
        if (a_instance.data === null) {
            UNIFACE.trace("newdata to render");
            a_instance.render(a_data);
        }
        else {
            var l_scope = req && req.scope ? req.scope.outScope : undefined;
            _uf.scope.nodes.occurrence.merge(a_instance.definition, a_instance.data, a_data, l_scope && l_scope[a_instance.instanceName] ? l_scope[a_instance.instanceName].occ : undefined);
            UNIFACE.trace("newdata to render");
            a_instance.render();
        }
    }
}


    /**
     * //TODOC
     */
_ufc.on("newdata", function (data, req) {
    var l_cptName, l_instance, l_data;
    for (l_cptName in data) if (data.hasOwnProperty(l_cptName) && typeof data[l_cptName] === "object") {
        l_data = data[l_cptName];
        // @b28718 perform only when lData is not empty.
        for (var l_ent in l_data) if (l_data.hasOwnProperty(l_ent)) {
            l_instance = _uf_instance_manager.makeInstance(l_cptName);
            renderView(l_instance, l_data, req);
            if (l_instance.views)
            {
                for (var i = 0; i < l_instance.views.length; ++i) {
                    renderView(l_instance.views[i].remoteInstance, l_data, req);
                }
            }
            break;
        }
    }
});



})(_uf.ui, _uf.transp, _uf.data, _uf.commands, _uf.InstanceManager);
/* %fv: ureq.js-6:ascii:1 % %dc: Tue Jul 14 16:24:19 2015 %*/
/*global UNIFACE JSON _uf uf_clientside uniface */

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.
    
    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
090717 c27474    9401c1  mzu Split from udatalayer.
100910 c28478    950101  ahn correction for clientside operation search
101027 t99504    950101  jnz RIA: API internal operations
140319 c30047    10.1.01 sse Change nodes.entity.merge for paginated data
140703 c30208    1010101 tsk HTML Form: send entity properties even if occurrences haven't changed
150519 c31365    970101  tsk Support OUT parameters and return value for JS activate and createInstance
date   refnum    version who description
*******************************************************************************/
/*global Promise */

/// <reference path="ubase.js" />
/// <reference path="uscope.js" />
/// <reference path="utransp.js" />

(function (_uf_cmd, requestManager, _uf_scope, Uniface_Event) {
    /**
    Requests that are suspended because *something* was blocked
    
    The output fields of suspended requests are blocked as well, to ensure proper order of request executions.
    
    Contains objects of type RequestScope
    */
    var blockedRequests = [],
        pendingBlockedRequests = [],
        numOfRunningRequests = 0,
        delayedTrigger;

    /**
    Process all blocked requests.
    
    Algorithm:
    - The output for all suspended requests is blocked. Unblock it first.
    - Go down the list, for each request:
        - Check whether it's still blocked
        - Block its output
        - If request was not blocked: execute it
        - Otherwise: leave on the queue
    
    This algorithm should be improved such that:
    - The enabled/disabled state for the fields that are blocked and unblocked during
    this process is updated only once, after the whole queue has been processed
    */
    function processBlockedRequests() {
        var l_shouldRescan = true;

        while (l_shouldRescan) {
            l_shouldRescan = false;

            try {
                numOfRunningRequests++;

                var i;
                for (i = 0; i < blockedRequests.length; i++) {
                    blockedRequests[i].unBlock();
                }
                i = 0;
                while (i < blockedRequests.length) {
                    var l_request = blockedRequests[i];
                    // 1. Check that the field firing the event still exists. If not, just discard it.
                    if (!l_request.checkInstance()) {
                        // Node is not connected to LUV any more - discard the request
                        blockedRequests.splice(i, 1);
                    }
                        // 2. Check that the request is not blocked any more, and block its output
                    else if (!l_request.checkAndBlock()) {
                        // @c28495 remove a blocked request from the queue before executing it
                        // otherwise a client side request executing directly causes an infinite loop
                        // as it always finds a blocked request, ie itself
                        blockedRequests.splice(i, 1);
                        l_request.execute();
                    }
                        // 3.  Check callback
                    else if (l_request.callbackMap) {
                        var l_commands = [];
                        var l_callbackMap = l_request.callbackMap;
                        var l_callback;

                        for (l_callback in l_callbackMap) if (l_callbackMap.hasOwnProperty(l_callback)) {
                            l_callback = l_callbackMap[l_callback];
                            if (!l_callback.result && !l_callback.requested) {
                                var l_req = new _uf_scope.RequestScope(l_callback.object, l_callback.name, l_callback.type, [], { "u:dynRequest": l_request }, requestManager.generateId());
                                l_callback.requested = true;
                                l_commands.push(l_req);
                            }
                        }

                        if (l_commands.length > 0) {
                            blockedRequests = blockedRequests.slice(0, i).concat(l_commands, blockedRequests.slice(i));
                        } else {
                            i++;
                        }
                    }
                        // 4. Goto next
                    else {
                        i++;
                    }
                }

            } finally {
                numOfRunningRequests--;
            } // try-finally

            if (numOfRunningRequests === 0 && pendingBlockedRequests.length > 0) {
                for (i = 0; i < pendingBlockedRequests.length; i++) {
                    blockedRequests.push(pendingBlockedRequests[i]);
                }
                pendingBlockedRequests = [];
                l_shouldRescan = true;
            }

        } //while (l_shouldRescan);
    }

    var UJSON_VERSION_ID = "vsn";
    var UJSON_VERSION = "9.7/1";

    function UJSON_Exception(msg) {
        Error.call(this, msg);
    }

    UJSON_Exception.prototype = new Error();

    UJSON_Exception.prototype.toString = function () {
        return this.message;
    };

    var UJSON_ERRMSG = "Try to clear your browser's cache and refresh, \n" +
            "or contact your application administrator.";

    function assertUJSONversion(ujson_object) {
        if (ujson_object[UJSON_VERSION_ID] !== undefined && ujson_object[UJSON_VERSION_ID] !== UJSON_VERSION) {
            UNIFACE.throwException(new UJSON_Exception(
                    "UJSON version mismatch\n (expected \"" + UJSON_VERSION + "\", received \"" +
                    ujson_object[UJSON_VERSION_ID] + "\").\n" + UJSON_ERRMSG));
        }
    }

    var idleEvent = new Uniface_Event();

    function isIdle() {
        return blockedRequests.length === 0 &&
                    pendingBlockedRequests.length === 0 &&
                    requestManager.shouldIdle();
    }
    var _fversion = "%version: 6 %";


    function callTriggerImmediately(a_realizedObject, a_triggerName, a_event, a_params) {
        var l_triggers;
        var l_promise;

        if (a_realizedObject.typeName === "occurrence")
        {
            // For occurrence objects the trigger definitions are on entity-level.
            l_triggers = a_realizedObject.entity.definition.triggers;
        }
        else
        {
            l_triggers = a_realizedObject.definition.triggers;
        }
        // If the rendered object has no trigger definitions at all,
        // there is nothing to do.
        if (!l_triggers) {
            return;
        }
        // If the rendered object has no definition for the specified trigger,
        // there is nothing to do either.
        var l_triggerName = a_triggerName.toLowerCase();
        var l_scope = l_triggers[a_triggerName];
        if (l_scope === undefined) {
            return;
        }
        // Call the trigger; pass an empty array of arguments (as triggers do not have any).
        if (a_params === undefined) {
            a_params = [];
        }

        l_promise = UNIFACE.dl.Notify(a_realizedObject, l_triggerName, "t", a_params, {});

        if (a_event) {
             // Don't "preventDefault" on dragstart, because it disables
            // the drag-and-drop functionality.
            if (a_event.type !== "dragstart" && typeof(a_event.preventDefault) === "function") {
                a_event.preventDefault();
            }
	    }

        return l_promise;
    }

    function callTriggerWithDelay(a_realizedObject, a_triggerName, a_delay, a_event, a_params) {
        // Set a timer for a callTriggerImmediately call to be executed
        // at a later time (after 'a_delay' milliseconds).

        // First check if the waiting trigger is for the same entity.
        if (delayedTrigger !== undefined) {
            if (delayedTrigger.realizedObject === a_realizedObject) {
                window.clearTimeout(delayedTrigger.timer);
                delayedTrigger.timer = window.setTimeout(delayedTrigger.delayedCall, a_delay);
                return;
            }
            else {
                // The waiting trigger is for another entity, first fire that 
                delayedTrigger.delayedCall();
            }
        }

        var delayedTriggerCall = function (index) {
            window.clearTimeout(delayedTrigger.timer);
            // Check if the entity exists 
            if (delayedTrigger.checkInstance()) {
                callTriggerImmediately(a_realizedObject, a_triggerName, a_event, a_params);
            }
            delayedTrigger = undefined;
        };

        // Delay firing of a trigger 
        var timer = window.setTimeout(delayedTriggerCall, a_delay);

        // Prepare delayedTrigger trigger object
        delayedTrigger = new _uf_scope.RequestScope(a_realizedObject, a_triggerName, "t", [], {}, requestManager.generateId());
        delayedTrigger.timer = timer;
        delayedTrigger.delayedCall = delayedTriggerCall;
    }

    function callTrigger(a_realizedObject, a_triggerName, a_event, a_params) {
        // If there is delayed trigger waiting to be executed,
        // execute it *now* (immediately),
        // before executing the requested trigger.

        if (delayedTrigger !== undefined) {
            delayedTrigger.delayedCall();
        }

        // There is no waiting trigger now so immediately call requested trigger i.e. a_triggerName 
        return callTriggerImmediately(a_realizedObject, a_triggerName, a_event, a_params);
    }


    UNIFACE.namespace("dl").extend(
    {
        version: _fversion, // Used only by UDOH

        /*
        Schedule calling a trigger after all pending commands have been processed.
        */
        postTrigger: function (a_field, a_triggerName, a_params) {
            _uf_cmd.add({ trigger: { field: a_field, triggerName: a_triggerName, params: a_params } });
        },

        /*------------------------------------------*/
        Notify: function (a_realizedObject, a_moduleName, a_moduleType, a_moduleArgs, a_requestArgs) {
            var l_ctx = new _uf_scope.RequestScope(a_realizedObject, a_moduleName, a_moduleType, a_moduleArgs, a_requestArgs, requestManager.generateId());
            if (!l_ctx.isCallable()) {
                UNIFACE.extension.popupWindow.showMessage("Instance " + l_ctx.instance.instanceName + (l_ctx.instance.componentName ? (" of component " + l_ctx.instance.componentName) : "") + ":\n\"" + a_moduleName + "\" is not callable.", "OK", "UNIFACE RIA Exception", 0, 0, "error");
                return Promise.reject(new uniface.NotCallable(a_moduleName, a_moduleType, l_ctx.instance.instanceName, l_ctx.instance.componentName));
            }
            if (l_ctx.checkAndBlock()) {
                var first_req = null;
                if (l_ctx.callbackMap) {
                    var l_callbackMap = l_ctx.callbackMap;
                    var l_callback;

                    for (l_callback in l_callbackMap) if (l_callbackMap.hasOwnProperty(l_callback)) {
                        l_callback = l_callbackMap[l_callback];
                        if (!l_callback.result && !l_callback.requested) {
                            var l_req = new _uf_scope.RequestScope(l_callback.object, l_callback.name, l_callback.type, [], { "u:dynRequest": l_ctx }, requestManager.generateId());
                            l_callback.requested = true;
                            if (l_req.checkAndBlock() || first_req) {
                                if (numOfRunningRequests > 0) {
                                    pendingBlockedRequests.push(l_req);
                                } else {
                                    blockedRequests.push(l_req);
                                }
                            } else {
                                first_req = l_req;
                            }
                        }
                    }
                }

                if (numOfRunningRequests > 0) {
                    pendingBlockedRequests.push(l_ctx);
                } else {
                    blockedRequests.push(l_ctx);
                }

                if (first_req) {
                    first_req.execute();
                }
            }
            else {
                l_ctx.execute();
            }
            return l_ctx.promise;
        },

        loadDSP: function (anInstance, dspMode) {
            var lParamSet = { "u:dspmode": dspMode };
            // Return a promise
            return _uf_cmd.add({ loaddsp: { instance: anInstance, args: lParamSet } });
        },

        postOperation: function (anInstance, anOperName, aRequestParamSet) {
            // Call the operation.
            // Supply the operation arguments as well;
            // caller of postOperation supplied them as fourth, fifth, etc. arguments.
            if (delayedTrigger !== undefined) {
                delayedTrigger.delayedCall();
            }
            var l_promise = UNIFACE.dl.Notify(anInstance, anOperName, "o", Array.prototype.slice.call(arguments, 3), aRequestParamSet);
            _uf_cmd.run();
            return l_promise;
        },
        idleEvent: idleEvent, // Used only by UDOH
        isIdle: isIdle, // Used only by UDOH
        forceIdle: function () { // Used only by UDOH
            var i;
            try {
                for (i = 0; i < blockedRequests.length; i++) {
                    blockedRequests[i].unBlock();
                }
            } catch (e) {
                return false;
            } finally {
                requestManager.abortAllReqs();
                blockedRequests = [];
                pendingBlockedRequests = [];
            }
            return true;
        },
        callTrigger: callTrigger,
        callTriggerWithDelay : callTriggerWithDelay
    }); // end of UNIFACE.dl

    _uf_cmd.on("queueEmpty", processBlockedRequests);

    _uf_cmd.on("idle", function () {
        if (isIdle()) {
            requestManager.clearRequestNum();
            idleEvent.fire();
        }
    });
    _uf_cmd.on("unblock", function (data, req) {
        req.scope.unBlock();
        processBlockedRequests();
    });
    // @c31365 out parameters and return value
    _uf_cmd.on("outparams", function (data, req) {
        req.resolutionValue.args = data.args;
        req.resolutionValue.returnValue = data.returnValue;
    });
    _uf_cmd.on("loaddsp", function (data) {
        if (!data.instance.definition || !data.instance.data) {
            // Call the 'exec' operation, supplying an empty array of arguments.
            return UNIFACE.dl.Notify(data.instance, "exec", "o", [], data.args).then(function () {
                if (data.instance && data.instance._pendingCreate) {
                    data.instance._pendingCreate = false;
                }
            });
        }
        else if (data.instance.widget) {
            data.instance.widget.doAttach(data.instance);
        }
    });
    _uf_cmd.on("trigger", function (data) {
        callTrigger(data.field, data.triggerName, undefined, []);
    });


})(_uf.commands, _uf.transp.requestManager, _uf.scope, _uf.Event); // Outer closure of datalayer namespace
// %fv:  usyntax.js-26:ascii:1 % %dc:  Fri Jun 26 16:13:50 2015 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/
/*******************************************************************************
date   refnum    version who description
110208 c28659    9501c1  jnz Ensure that int2ext method receives a string as parameter
date   refnum    version who description
*******************************************************************************/

/*global UNIFACE document dojo dijit */
/// <reference path="ubase.js" />

UNIFACE.namespace("syn").extend(
// This anonymous function enables use of PRIVATE namespace members
function(){

    /* internal applet representation for wildcard characters */
    var PROFILE = {
        WILD      : { "INT": "\u0010", "INTRE": /\u0010/g, "EXT": "*", "RE": /\*/g, "ERE":   /\\\*/g },
        WILD1     : { "INT": "\u0011", "INTRE": /\u0011/g, "EXT": "?", "RE": /\?/g, "ERE":   /\\\?/g },
        EQUAL     : { "INT": "\u0012", "INTRE": /\u0012/g, "EXT": "=", "RE": /\=/g, "ERE":   /\\=/g  },
        GREATER   : { "INT": "\u0013", "INTRE": /\u0013/g, "EXT": ">", "RE":  />/g, "ERE":   /\\>/g  },
        LESS      : { "INT": "\u0014", "INTRE": /\u0014/g, "EXT": "<", "RE":  /</g, "ERE":   /\\</g  },
        NOT       : { "INT": "\u0015", "INTRE": /\u0015/g, "EXT": "!", "RE":  /!/g, "ERE":   /\\!/g  },
        AND       : { "INT": "\u0016", "INTRE": /\u0016/g, "EXT": "&", "RE":  /&/g, "ERE":   /\\&/g  },
        OR        : { "INT": "\u0017", "INTRE": /\u0017/g, "EXT": "|", "RE": /\|/g, "ERE":   /\\\|/g },
        SEP       : { "INT": "\u001b", "INTRE": /\u001b/g, "EXT": ";", "RE":  /;/g, "ERE":   /\\;/g }
    };
    
    var SEPARATORS = [ PROFILE.EQUAL, PROFILE.GREATER, PROFILE.LESS, PROFILE.NOT, PROFILE.AND, PROFILE.OR, PROFILE.SEP ];
    var SEPARATOR = [ PROFILE.SEP ];
    var PROFILECHARS = [ PROFILE.EQUAL, PROFILE.GREATER, PROFILE.LESS, PROFILE.NOT, PROFILE.AND, PROFILE.OR ];
    var WILDCARDS = [ PROFILE.WILD, PROFILE.WILD1 ];
    var ESCAPABLES = [ PROFILE.EQUAL, PROFILE.GREATER, PROFILE.LESS, PROFILE.NOT, PROFILE.AND, PROFILE.OR, PROFILE.WILD, PROFILE.WILD1 ];
    
function concatChars(a_profileChars, a_intorExt)
{
    var i;
    var l_concat="";
    
    for (i in a_profileChars) if (a_profileChars.hasOwnProperty(i))
    {
        if (typeof a_profileChars[i][a_intorExt] == "string")
        {
            l_concat += a_profileChars[i][a_intorExt];
        }
        else
        {
            l_concat += a_profileChars[i][a_intorExt].source;
        }
        
    }
    return l_concat;
}    

function profileRegex(a_profileChars, a_intorExt)
{
    return new RegExp("[" + concatChars(a_profileChars, a_intorExt)+ "]");
}

var EVENSLASHES = "(^|[^\\\\])(\\\\\\\\)*";
var INTERNALSEPARATORS = new RegExp( "()()([" + concatChars(SEPARATORS, "INT") + "])");
var EXTERNALSEPARATORS = new RegExp( EVENSLASHES + "(\\\\[" + concatChars(SEPARATORS, "RE") + "])");
var INTERNALSEPARATOR = new RegExp( "()()([" + concatChars(SEPARATOR, "INT") + "])");
var EXTERNALSEPARATOR = new RegExp( EVENSLASHES + "(\\\\[" + concatChars(SEPARATOR, "RE") + "])");
var ESCAPES = new RegExp("\\\\(?=[" + concatChars(ESCAPABLES, "RE") + "])", "g");
var NOESCAPES = new RegExp("(?=[" + concatChars(ESCAPABLES, "RE") + "])", "g");
var SWAPPEDSEPARATORS = new RegExp( EVENSLASHES + "([" + concatChars(SEPARATORS, "RE") + "])");
var SWAPPEDSEPARATOR = new RegExp( EVENSLASHES + "([" + concatChars(SEPARATOR, "RE") + "])");

var WILDRE     = profileRegex(WILDCARDS, "INT");
/*
external (WEB/escaped) rep to Internal (UNIFACE) rep
*/
function ext2int(a_string, aSwapProfile)
{
	if (typeof a_string !== "string")
	{
		a_string = a_string.toString();
		//return a_string; if you do not return a string then follows the next exception
	}
    if (aSwapProfile == undefined) // pragma(allow-loose-compare)
    {
        aSwapProfile = "ERE";
    }
    var p;
    var l_subE = a_string.split(/\\\\/);
    var i;
    var l_res = "";
    for (i=0; i<l_subE.length; i++)
    {
        var l_sub = l_subE[i];
        for (p in ESCAPABLES) if (ESCAPABLES.hasOwnProperty(p))
        {
            l_sub = l_sub.replace(ESCAPABLES[p][aSwapProfile], ESCAPABLES[p].INT);
        }
        // Remove ESCAPES if we're swapped
        if (aSwapProfile==="RE")
        {
            l_sub = l_sub.replace(ESCAPES, "");
        }        
        if (l_res)
        {
            l_res += "\\";  
        }
        l_res += l_sub;
    }
    return l_res;
}

/* 
internal to external (WEB/Escaped)
*/
function int2ext(a_string, aSwapProfile)
{
	if (typeof a_string !== "string")
	{
		a_string = a_string.toString();
		//return a_string; if you do not return a string then follows the next exception
	}
    a_string = a_string.replace(/\\/g, "\\\\");
    if (aSwapProfile)
    {
        a_string = a_string.replace(NOESCAPES, "\\");
    }
    var p;
    for (p in ESCAPABLES) if (ESCAPABLES.hasOwnProperty(p))
    {
        a_string = a_string.replace(ESCAPABLES[p].INTRE, aSwapProfile ? "" : "\\" + ESCAPABLES[p].EXT);
    }
    return a_string;
}

function getSubFields(a_field, a_intOrExtOrSwap)
{
    if (typeof (a_field) !== "string") {
        return [{ val: a_field, profile: "" }];
    }
    if (a_intOrExtOrSwap == null) /* pragma(allow-loose-compare) */
    {
        a_intOrExtOrSwap = INTERNALSEPARATORS;
    }
    var l_subFields=[];
    var l_sfs = UNIFACE.splitString(a_field, a_intOrExtOrSwap);
    var l_idx ;

    for (l_idx = 0; l_idx<l_sfs.length; l_idx += 4)
    {
        var l_ob;
        if (l_sfs[l_idx+1] === undefined)
        {
            l_ob = { val : l_sfs[l_idx], profile :  "" };
        }
        else
        {
            l_ob = { val : l_sfs[l_idx] + l_sfs[l_idx+1] + l_sfs[l_idx+2], profile :  l_sfs[l_idx+3] };
        }
        l_subFields.push(l_ob);
    }
    return l_subFields;
}

function mergeSubFields(a_fields)
{
    var l_idx;
    var l_res="";

    if (a_fields.length == 1 && typeof(a_fields[0].val !== "string"))
    {
        return a_fields[0].val;
    }
    for (l_idx = 0; l_idx<a_fields.length; l_idx++)
    {
        l_res += a_fields[l_idx].val + a_fields[l_idx].profile;
    }
    return l_res;
}

function format2regex(entryFormat)
{
    // Implementation 1: home-grown loop
    var j;
    var l_reText="";

    for (j=0; j< entryFormat.length; j++)
    {
        // 1. Special chars
        switch(entryFormat.charAt(j))
        {
            case '~':
                switch (entryFormat.charAt(j+1))
                {
                    case '&':
                        l_reText += "[A-Za-z\\u0080-\\uFFFF]"; 
                        j++;
                        break;   
                    case '@':
                        l_reText += "[\\w\\u0080-\\uFFFF]";    
                        j++;
                        break;
                }
                continue;
            case '%':
                // Escaped: treat next char as literal
                switch (entryFormat.charAt(j+1))
                {
                    case '%':
                        if (entryFormat.charAt(j+1)==="^")
                        {
                            l_reText += "(\\n|\\r|\\r\\n)";
                            j+=2;
                            
                        } 
                        else
                        {
                            l_reText += entryFormat.charAt(j+1); 
                            j++;
                        }
                        break;
                    case '(':
                    case ')':
                    case '*':
                    case '?':
                        l_reText += "\\"; /* pragma(fallthrough) */
                    case '@':
                    case '&':
                    case '#':
                        l_reText += entryFormat.charAt(j+1); 
                        j++;
                }
                break;                
            case '(':
                l_reText += "(";
                continue;
            case ')':
                l_reText += ")?";    
                continue;
            case '#':
                l_reText += "[0-9]";
                continue;
            case '&':
                l_reText += "[A-Za-z]";
                continue;            
            case '@':
                l_reText += "\\w";
                continue;            
            case '*':
                switch (entryFormat.charAt(j-1))
                {
                    case '&':
                    case '#':
                    case '?':
                    case '@':
                        l_reText += "*";
                        break;
                     default:
                        l_reText += ".*";
                        break;
                }
                continue;   
            case '?':
                l_reText += ".";
                continue;   
            case '[':
            case ']':
            case '.':
            case '\\':
            case '^':
            case '$':
            case '+':
            case '|':
            case '{':
            case '}':
                l_reText += "\\";  /* pragma(fallthrough) */
            default:
               l_reText += entryFormat.charAt(j);
                                       
        }
    }
    
    return new RegExp("^" + l_reText + "$");
}

function checkNumeric(subfld, scale)
{
    var output = subfld.newValue;
    // No check if there are wildcards....
    if (!output.match(WILDRE))
    {
        // 1. Prepare for match: make decimal separator a dot, remove thousand separators
        var l_sep = ".";
        if (subfld.syntax.DIS != undefined) /* pragma(allow-loose-compare) */
        {
            if (subfld.syntax.DIS.charAt(0)==="N")
            {
                if (subfld.syntax.DIS.charAt(1)===",")
                {
                    output = output.replace(/\./g,"").replace(/,/g,".");
                    l_sep = ",";
                }
            }
        }
        output = output.replace(/,/g,"");
        
        // 2. Check
        var lNumRe = /^\s*(\+|-)?([0-9]*)(\.)?([0-9]*)?((e|E)?(\+|-)?([0-9]*)?)?(\+|-)?\s*$/;
        var l_num = output.match(lNumRe);
        if (!l_num)
        {
            throw new UNIFACE.syn.SyntaxError("0123", subfld.fieldName);
        }
        // 3. Normalize
        //var l_num = 
        // sign: $1, mant: $2 (.) $4 , exp sign: $7, exp: $8
        var l_sign = l_num[1] ? l_num[1] : "",
            l_whole = l_num[2] ? l_num[2] : "0",
            l_dot = l_num[3] ? l_num[3] : "",
            l_dec  = l_num[4] ? l_num[4].replace(/(^0)?0*$/,"$1") : "", // remove trailing spaces from decimal portion
            l_expsign = l_num[7] ? l_num[7] : "",
            l_exp = l_num[8] ? l_num[8] : "";
       
        var exp = parseInt(l_num[7]+"0"+l_num[8],10);
        
        // 4. Round in the Uniface way....
        if (scale != undefined) /* pragma(allow-loose-compare) */
        {
            var l_scale = parseInt(scale,10);
            var l_decimals = l_dec.length - exp;
            if (l_decimals > l_scale)
            {
                var l_mant = l_whole+l_dec;
                var l_newNum = "";
                
                var l_pos = l_mant.length - l_decimals + l_scale;
                if (l_pos >= 0  )
                {
                    var i;
                    var l_c;
                    if (l_mant.charAt(l_pos) >='5')
                    {
                        while(l_pos >=0 )
                        {
                            if (l_pos === 0)
                            {
                               l_newNum = "1" + l_newNum;
                            }
                            else 
                            {
                                l_c = l_mant.charAt(l_pos-1);
                                if (l_c === "9")
                                {
                                    l_newNum = "0" + l_newNum;

                                }
                                else
                                {
                                    l_newNum = (parseInt(l_c,10)+1).toString() + l_newNum;
                                    l_pos--;
                                    break;
                                }
                            }
                            l_pos--;
                        }       
                    }                             
                    if (l_pos >=0)
                    {
                        l_newNum = l_mant.slice(0,l_pos) + l_newNum;
                    }
                    for (l_pos = l_mant.length - l_decimals + l_scale; l_pos < l_mant.length; l_pos++)
                    {
                        l_newNum += "0";
                    }
                    l_whole = l_newNum.substr(0, l_newNum.length - l_dec.length);
                    l_dec = l_newNum.substr(l_newNum.length - l_dec.length);
                    
                }
                else // l_pos <0
                {
                    subfld.newValue = 0;
                    return;                               
                }                              
            }
        }
        
        // 5. Create new representation                                                    
        subfld.newValue = (l_sign==="-" ? "-" : "");
        subfld.newValue +=l_whole;
        if (l_dec || l_dot === l_sep)
        { 
            subfld.newValue += l_sep + l_dec;
        }
        if (l_exp)
        {
            subfld.newValue += "e" + (l_expsign==="-" ? "-" : "+") + l_exp;
        }
    }
}

var datatypechecks = {
    "N" : function (subfld)
    {
        return checkNumeric(subfld, subfld.syntax.SCALE);
    },
    "S" : function (subfld, special)
    {
        if (!special && subfld.newValue.match(/[\u0100-\u058f\u0600-\uFF64\uFF9F-\uFFFF]/))
        {
            throw new UNIFACE.syn.SyntaxError("0131", subfld.fieldName);
        }
    },
    "F" : checkNumeric
     /*               {
                    }

                    else if (datatype.equals("D") || datatype.equals("d")) 
                    {
                        displayFormat  = syntaxset.getShorthandStringValue("DIS", "dd-mmm-yyyy"); 
                        entryFormat    = syntaxset.getShorthandStringValue("ENT"); 
                        centuryBreak   = syntaxset.getShorthandStringValue("CENTBR"); // get century break
                        checkdatetime checkDateTime = new checkdatetime(datatype, subFieldValue, displayFormat, entryFormat, toDay);
                        checkDateTime.setCenturyBreak(centuryBreak);
                        output = checkDateTime.check();
                    }
                    else if (datatype.equals("T") || datatype.equals("t"))
                    {
                        displayFormat  = syntaxset.getShorthandStringValue("DIS", "hh:nn:ss");
                        entryFormat    = syntaxset.getShorthandStringValue("ENT"); 
                        checkdatetime checkDateTime = new checkdatetime(datatype, subFieldValue, displayFormat, entryFormat, toDay);
                        output = checkDateTime.check();
                    }
                    else if (datatype.equals("E") || datatype.equals("e")) 
                    {
                        displayFormat  = syntaxset.getShorthandStringValue("DIS", "dd-mmm-yy hh:nn:ss");
                        entryFormat    = syntaxset.getShorthandStringValue("ENT"); 
                        centuryBreak   = syntaxset.getShorthandStringValue("CENTBR"); // get century break
                        checkdatetime checkDateTime = new checkdatetime(datatype, subFieldValue, displayFormat, entryFormat, toDay);
                        checkDateTime.setCenturyBreak(centuryBreak);
                        output = checkDateTime.check();
                    }    */
};

var subfieldChecks = {
    "DATTYP" :  function(shorthand, subfld)   {
            var lDataType = ("" + shorthand).toUpperCase();
            
            var special = false;
            var output = "";

            if (lDataType.length == 2)
            {
                lDataType = lDataType.charAt(1);
                special = true;
            }
            // datatype checking
            // numeric, float, date, time, datetime
            var subFieldValue = subfld.newValue;
            if (subFieldValue.length > 0) // datatype checking only required if there is a value 
            {
                output = subFieldValue;
                var l_check = datatypechecks[lDataType];
                if (l_check !== undefined)
                {
                    l_check(subfld, special);
                }
            }
        },
    "WIDTYP": function(shorthand, subfld)  {
            var sV = subfld.newValue;
            if (sV.length > 0 && !sV.match(WILDRE) && subfld.valrep !== undefined && 
            		subfld.valrep.constructor===Array && subfld.valrep[0][sV] === undefined )
            {
                throw new UNIFACE.syn.SyntaxError("0119", subfld.fieldName);
            }
        },
    "ENT":function handleShorthandEnt( shorthand,  subfld)  {
            var subFieldValue = subfld.newValue;
            
            var datatype = subfld.syntax.DATTYP;//set.getShorthandDatatype(); 
            if (datatype.length == 2)
            {
                datatype = datatype.charAt(1);
            }
            
            if (datatype==="S") // only perform entry format checking for string fields @pr08
            {
                if (subfld.syntax.ENT_regex === undefined) 
                {
                    subfld.syntax.ENT_regex  = format2regex(shorthand);
                }
                var l_regEx =  subfld.syntax.ENT_regex;
                if (l_regEx && !subFieldValue.match(l_regEx))
                {
                    throw new UNIFACE.syn.SyntaxError("0126", subfld.fieldName);                        
                }
            }
        },
    "LEN": function (shorthand, subfld)   {
    
            var len=0;
            var subFieldValue = subfld.newValue;
            len = subFieldValue.length; 
            if (!subFieldValue.match(WILDRE) && len > 0 && len < shorthand.min)
            {
                //syntaxexception.setParam(fieldname.getFld());
                throw new UNIFACE.syn.SyntaxError("0121", subfld.fieldName);
            }
            // A C*,MAN field has LEN(1,0). Here max has no other meaning than: there *is* no max.
            if (len > shorthand.max && shorthand.max > shorthand.min)
            {
                //syntaxexception.setParam(fieldname.getFld());
                throw new UNIFACE.syn.SyntaxError("0120", subfld.fieldName);
            }
        },
    "BRM": function( shorthand,  subfld) {
            if (shorthand === true) {
                var l_len1 = subfld.newValue.match(/[\[\{\(]/g);
                if (l_len1 !== null)
                {
                    l_len1 = l_len1.length;
                }
                var l_len2 = subfld.newValue.match(/[\]\}\)]/g);
                if (l_len2 !== null)
                {
                    l_len2 = l_len2.length;
                }
                
                if (l_len1 !== l_len2)
                {
                    throw new UNIFACE.syn.SyntaxError("0137", subfld.fieldName);
                }
            }
        },
    "DIG": function (shorthand, subfld) {
            if (shorthand === true) {
                if (subfld.newValue.match(new RegExp("[^" + concatChars(WILDCARDS, "RE") + "0-9 ]") ))
                {
                    throw new UNIFACE.syn.SyntaxError("0123", subfld.fieldName);
                }
            }
        },
    "NUM": function( shorthand, subfld)   {
            if (shorthand === true) {
                if (subfld.newValue.match(new RegExp("[^," + concatChars(WILDCARDS, "RE") + "0-9\\.\\-+ e|E]") ))
                {
                    throw new UNIFACE.syn.SyntaxError("0123", subfld.fieldName);
                }
            }
        },
    "ASC": function(shorthand,  subfld)   {
            if (shorthand === true) {
                var subFieldValue = subfld.newValue;
                //syntaxdebug.writeDebug(2, "ASC");
                var i;
                for (i = 0; i < subFieldValue.length; i++)
                {
                    if (subFieldValue.charCodeAt(i) > 0x007F)
                    {
                        throw new UNIFACE.syn.SyntaxError("0131", subfld.fieldName);
                    }
                }
            }
        },
    "MUL":  function( shorthand,  subfld) 
        {
            if (shorthand === true) {
                var subFieldValue = subfld.newValue;
                var i;
                for ( i = 0; i < subFieldValue.length; i++)
                {  // @PR24
                    if (subFieldValue.charAt(i) > '\u00FF')
                    {
                        throw new UNIFACE.syn.SyntaxError("0131", subfld.fieldName);
                    }
                }
            }
        },
    "MINVAL": function( shorthand,  subfld) 
        {
            if (shorthand === true) {
                var l_actNum = parseFloat(subfld.newValue);
                var l_min = parseFloat(shorthand.min);
                if (!isNaN(l_min) && !isNaN(l_actNum))
                {
                    if (l_actNum < l_min)
                    {
                        throw new UNIFACE.syn.SyntaxError("0121", subfld.fieldName);
                    }
                }
            }
        },
    "MAXVAL": function( shorthand,  subfld)
        {
            var l_actNum = parseFloat(subfld.newValue);
            var l_max = parseFloat(shorthand.min);
            if (!isNaN(l_max) && !isNaN(l_actNum))
            {
                if (l_max < l_actNum )
                {
                    throw new UNIFACE.syn.SyntaxError("0120", subfld.fieldName);
                }
            }
        },
    "LOW": function( shorthand,  subfld)  {
            if (shorthand === true) {
                subfld.newValue = subfld.newValue.replace(/[A-Z]/g, function($1) { return $1.toLowerCase(); } );
            }
        },  
    "UPC": function( shorthand,  subfld)  {
            if (shorthand === true) {
                subfld.newValue = subfld.newValue.replace(/[a-z]/g, function($1) { return $1.toUpperCase(); } );
            }
        },  
    "RCS": function( shorthand,  subfld)    {
            if (shorthand === true) {
                subfld.newValue = subfld.newValue.replace(/([ \t])[ \t]+/g, "$1");
            }
        },
    "DLS": function( shorthand,  subfld)   {
            if (shorthand === true) {
                subfld.newValue = subfld.newValue.replace(/^[ \t]*/, "");
            }
        },
    "DLZ": function ( shorthand,  subfld)
        {
            if (shorthand === true) {
                subfld.newValue = subfld.newValue.replace(/^0*/, "");
            }
        }
};
        
var wholeFieldChecks = {
   /*            
    // toDay is used to be able to use an other date in testscripts (for example to be able
    // to test Y2K testcases)
    // using this feature it is possible to set an other date in stead of today during testing
    // it is implemented using a special TODAY(29022000) syntax mnemonic (only allowed when testing)
    //private static Date toDay = new Date();                                         // @pr01 @pr09
    "TODAY": function(shorthand)
        {
            Date setDate;
            int year, month, day;
            String newDate = shorthand.getValue(); // set a new date as today
            if (!syntaxdebug.inDebugMode()) // test to see if this applet is in debugmode
            {
                //syntaxexception.setParam("Internal error: Shorthand Syntax Error: TODAY");
                throw new UNIFACE.syn.SyntaxError("0000", fieldVal.fieldName);
            }
            try
            {
                syntaxdebug.writeDebug(2, "TODAY [" + shorthand.getValue() + "]");
                year  = Integer.valueOf(newDate.substring(4, 8)).intValue() - 1900;     // years since 1900
                month = Integer.valueOf(newDate.substring(2, 4)).intValue() - 1;        // month 0-11
                day   = Integer.valueOf(newDate.substring(0, 2)).intValue();            // day of month 1-31
                setDate = new Date(year, month, day);
                toDay = setDate;
                syntaxdebug.writeDebug(4, "new date2 [" + toDay + "]");
            }
            catch(NumberFormatException e)
            {
                //syntaxexception.setParam("Internal error: Shorthand Syntax Error: TODAY(" + newDate + ")");
                throw new UNIFACE.syn.SyntaxError("0000", fieldVal.fieldName);
            }
        },  */
    "NED":function ( shorthand, fieldVal) {
            if (shorthand === true) {
                if (fieldVal.fieldValue !== fieldVal.originalValue)
                {
                    throw new UNIFACE.syn.SyntaxError("0104", fieldVal.fieldName);
                }
            }
        }, 
    "NEDKEY": function(shorthand, fieldVal) {
            if (shorthand === true) {
                if (fieldVal.fieldValue !== fieldVal.originalValue)
                {
                    throw new UNIFACE.syn.SyntaxError("0105", fieldVal.fieldName);
                }
            }
        },
    "DIM": function( shorthand, fieldVal) {
            if (shorthand === true) {
                if (fieldVal.fieldValue !== fieldVal.originalValue)
                {
                    throw new UNIFACE.syn.SyntaxError("0104", fieldVal.fieldName);
                }
            }
        },
    "MAN": function(shorthand, fieldVal) {
            if (shorthand === true) {
                var i;
                for (i = 0; i<fieldVal.subfields.length; i++)
                {
                    if (fieldVal.subfields[i].val.length > 0)
                    {
                        return;
                    }
                }
                throw new UNIFACE.syn.SyntaxError("0129", fieldVal.fieldName);
            }
        }
};
    
return { // Export PUBLIC members of the namespace
	vsn : "9.7/1", // UJSON_VERSION
	
    ExtensiveValue : function(a_fieldValue, a_originalValue, a_fieldName, a_syntax, a_valrep) {
        var l_newValue;
        var l_PROF = "ERE";
        if (a_syntax.SWAPGP != undefined && a_syntax.SWAPGP) { // pragma(allow-loose-compare)
            l_PROF = "RE";
        }
        if (a_syntax.NGLD) { // pragma(allow-loose-compare)
            l_newValue = a_fieldValue;
        } else {
            l_newValue = ext2int(a_fieldValue, l_PROF);
        }
        
        this.originalValue = a_originalValue;
        this.fieldValue = a_fieldValue;
        this.newValue = l_newValue;
        this.normalizedValue = l_newValue;
        this.syntax = a_syntax;
        this.valrep = a_valrep;
        this.fieldName = a_fieldName;
        this.error = null;
    },
    int2ext : function(a_syntax, a_fieldValue)
    {
        if (!a_syntax.NGLD) /* pragma(allow-loose-compare) */
        {
            return  int2ext(a_fieldValue, (a_syntax.SWAPGP != undefined && a_syntax.SWAPGP) );/* pragma(allow-loose-compare) */
        }
        return a_fieldValue;
    },
    checkField : function(a_syntax, a_fieldValue, a_originalValue, a_valrep, a_fieldName)
    {
        var l_shorthand;
        var l_fieldValue = new UNIFACE.syn.ExtensiveValue(a_fieldValue, a_originalValue, a_fieldName, a_syntax, a_valrep);
        
        try
        {
            var l_subFields;
            if (a_syntax.NGLD)
            {
                l_subFields =  getSubFields(l_fieldValue.newValue, INTERNALSEPARATOR);
            }
            else
            {
                l_subFields = getSubFields(l_fieldValue.newValue);
            }
                    
            l_fieldValue.subfields = l_subFields;
            for (l_shorthand in a_syntax)
            {
               if (a_syntax[l_shorthand] !==undefined && wholeFieldChecks[l_shorthand] != undefined) /* pragma(allow-loose-compare) */
               {
                   wholeFieldChecks[l_shorthand](a_syntax[l_shorthand], l_fieldValue );
               }
            }
            
            var l_subFieldValue = 
                    { 
                        syntax : a_syntax,
                        valrep : a_valrep,
                        originalValue : "",
                        fieldName : a_fieldName,
                        error: null
                    };            
            var l_sfIdx;
            for (l_sfIdx = 0; l_sfIdx < l_subFields.length; l_sfIdx++)
            {
                if (typeof l_subFields[l_sfIdx].val === "string") {

                    l_subFieldValue.fieldValue = l_subFields[l_sfIdx].val;
                    l_subFieldValue.newValue = l_subFieldValue.fieldValue;

                    for (l_shorthand in a_syntax) {
                        if (a_syntax[l_shorthand] !== undefined && subfieldChecks[l_shorthand] != undefined) /* pragma(allow-loose-compare) */ {
                            subfieldChecks[l_shorthand](a_syntax[l_shorthand], l_subFieldValue);
                        }
                    }
                    // subfieldChecks.WIDTYP(a_syntax.WIDTYP, l_subFieldValue );
                    l_subFields[l_sfIdx].val = l_subFieldValue.newValue;
                }
            }
            l_fieldValue.normalizedValue = mergeSubFields(l_subFields);
            if (a_syntax.NGLD)
            {
                l_fieldValue.newValue = l_fieldValue.normalizedValue;
            }
            else
            {
                l_fieldValue.newValue = int2ext(l_fieldValue.normalizedValue, (a_syntax.SWAPGP != undefined && a_syntax.SWAPGP) );/* pragma(allow-loose-compare) */
            }
        }
        catch (e)
        {
            if (e instanceof UNIFACE.syn.SyntaxError)
            {
                l_fieldValue.error = e;
            }
            else
            {
                UNIFACE.throwException(e);
            }
        }
        return l_fieldValue;        
    },
    SyntaxError : function(a_code)
    {
        this.exceptionCode = a_code;
    },
    isValidProp : function(propName)
    {
        propName = propName.toUpperCase();
        return subfieldChecks[propName] || wholeFieldChecks[propName];
    }
}; // return 

}() // Immediately call anonymous function

);

(function()
{
var uMessages = {
"0104" : "0104 - Field is display only.",
"0105" : "0105 - Not allowed to change primary key field.",
"0119" : "0119 - Illegal ValRep value.",
"0120" : "0120 - Subfield too large.",
"0121" : "0121 - Subfield too small.",
"0123" : "0123 - Illegal format for Numeric field.",
"0124" : "0124 - Illegal format for Date field.",
"0125" : "0125 - Illegal format for Time field.",
"0126" : "0126 - Illegal syntax format.",
"0127" : "0127 - Illegal entry format.",
"0129" : "0129 - Subfield(s) are required.",
"0130" : "0130 - Too many subfields specified.",
"0131" : "0131 - One or more characters not found in character set.",
"0132" : "0132 - Illegal numeric.",
"0137" : "0137 - Open/close brackets do not match.",
"0138" : "0138 - Illegal format for floating field."
};


UNIFACE.syn.SyntaxError.prototype.toString = function() {
    return uMessages[this.exceptionCode];
};

})();
// %fv: uwidget.js-85:ascii:1 % %dc: Fri Sep  4 13:02:49 2015 %

/*******************************************************************************
date   refnum   version who description
090205 c27248   9.ajax  jdk acceskeys do not work & labels etc show the %sign
090305 c27328   9.ajax  fd  Move common code up in widget class inheritance tree
100728 c28434   950101  pdk Add OnEdit trigger
100824 c28434    9.5.01.01 mzu OnEdit trigger with new callback API
140602 c30088    mx05    tsk Add custom HTML properties mapping to HTML attributes
date   refnum   version who description
*******************************************************************************/
/*global _uf UNIFACE */

(function() {

/**
 * UNIFACE widgetFactory for creating widgets.
 *      addCreator:
 *          Accepts a function that is a widget creator. This function
 *          is then added to the list of known widget creator functions.
 *          It should implement one method: createWidget().
 *      create:
 *          Creates a widget by calling the appropriate widget creator.
 *          Throws an error if there is no appropriate widget creator.
 */
UNIFACE.widgetFactory = (function() {

    var widgetCreators = { };

    function restoreHtmlProperties(widget, backupHtmlProps) {
        var p, lSetter;
        for (p in backupHtmlProps) if (backupHtmlProps.hasOwnProperty(p)) {
            lSetter = widget["setHtml_" + p];
            if (typeof lSetter === "function") {
                lSetter.call(widget, backupHtmlProps[p]);
            } else {
                widget.setHtmlProp(p, backupHtmlProps[p]);
            }
        }
    }
    // @c30088
    function restoreAttributeProperties(widget, backupAttProps) {
        var p, lSetter;
        for (p in backupAttProps) if (backupAttProps.hasOwnProperty(p)) {
            lSetter = widget["setHtml_" + p];
            if (typeof lSetter === "function") {
                lSetter.call(widget, backupAttProps[p]);
            } else {
                widget.setAttributeProp(p, backupAttProps[p]);
            }
        }
    }
    function restoreStyleProperties(styleNodes) {
        var cssText;
        for (var i=0, len = styleNodes.length; i < len; i++) {
            if (styleNodes[i]._U_backupCssText !== undefined) {
                styleNodes[i].style.cssText = styleNodes[i]._U_backupCssText;
            }
        }
    }

    function setHtmlProperties(widget, aProps, backupHtmlProps) {
        var lSetter, oldValue;
        // Set the html properties
        for (var p in aProps.html) if (aProps.html.hasOwnProperty(p)) {
            lSetter = widget["setHtml_" + p];
            if (typeof lSetter === "function") {
                oldValue = lSetter.call(widget, aProps.html[p]);
            } else {
                oldValue = widget.setHtmlProp(p, aProps.html[p]);
            }
            backupHtmlProps[p] = oldValue;
        }
    }
    // @c30088
    function setAttributeProperties(widget, aProps, backupAttributeProps) {
        var lSetter, oldValue;
        // Set the html attributes
        for (var p in aProps.att) if (aProps.att.hasOwnProperty(p)) {
            lSetter = widget["setHtml_" + p];
            if (typeof lSetter === "function") {
                oldValue = lSetter.call(widget, aProps.att[p]);
            } else {
                oldValue = widget.setAttributeProp(p, aProps.att[p]);
            }
            backupAttributeProps[p] = oldValue;
        }
    }

    function setStyleProperties(widget, aProps) {
        var element = widget.getElement();
        if (element && element.style != undefined) { // pragma(allow-loose-compare)
            var l_style = element.style;
            var p, lSetter;
            for (p in aProps.preStyle) if (aProps.preStyle.hasOwnProperty(p)) {
                lSetter = widget["setStyle_" + p];
                if (typeof lSetter === "function") {
                    lSetter.call(widget, aProps.preStyle[p]);
                } else {
                    widget.setStyleProp(p, aProps.preStyle[p]);
                }
            }

            if (aProps.preStyle.display != undefined ) { // pragma(allow-loose-compare)
                element.U_display = aProps.preStyle.display;
            }
        }
    }

    function setUnifaceProperties(widget, aProps) {
        if (typeof widget.setUnifaceProp === "function") {
            for (var p in aProps.uniface) if (aProps.uniface.hasOwnProperty(p)) {
                widget.setUnifaceProp(p, aProps.uniface[p]);
            }
        }
    }

    /*
     * Calls the mapEvent() function of the widget for each of
     * the "public web" triggers that is defined in triggerDefs.
     * The widget may choose to actually map an event to the trigger.
     */
    function mapEvents(widget) {
        var l_ev, l_evs = widget.callBack.getEvents();
        if (widget.mapEvents)
        {
            widget.mapEvents();
        }
        if (widget.mapEvent)
        {
            for (l_ev in l_evs) if (l_evs.hasOwnProperty(l_ev))
            {
                widget.mapEvent(l_ev, l_evs[l_ev]);
            }
        }
    }

    function createConstructor(Acreator, a_classname) {
        var F = function () { Acreator.apply(this, arguments); };
        if (!Acreator)
        {
            throw new Error("Unable to find constructor " + a_classname);
        }
        F.prototype = new Acreator();
        var vr_supported = typeof (F.prototype.getValrep) === "function";
        UNIFACE.extend.call(F.prototype, {
            className: a_classname,        // Gets the widget's "class name".      Only used by tests.
            getValrep: _uf.nstr,
            getRepresentation: _uf.nstr,
            isValrepSupported: vr_supported,  // Only used by tests.
            validate: _uf.nop,                        // Lets the widget check its value.     Used from uluv.
            setLayout: _uf.nop,                     // DSP container only.                  Used from uluv.
            setRepresentation : _uf.nop,              // Sets widget's representation         Only used by tests.
            setResource : _uf.nop,                       // Sets widget resource.                Used from uluv.
            setValrep:  _uf.nop,                       // Sets widget valrep.                  Used from uluv.
            getBlockedProperties: _uf.nop,                        // get blockedProperties.               Used from uluv.
            unrender : _uf.nop,                          // Unrenders widget.                    Used from uluv.
            dispose : _uf.nop                          // Unrenders widget.                    Used from uluv.
        }, function (a_func) { return typeof F.prototype[a_func] === "undefined"; });
        return F;
    }

function createWrapper(widget) {
    var widgetStyleNodes = [],
     widgetBackupHtmlProps = {},
	 widgetBackupAttProps = {};

    var l_setProps = widget.setProperties;
    UNIFACE.extend.call(widget, {
        // Define a nodesChanged function.
        // This will be always be called after rendering of the widget
        // but the widget itself may choose to call it at other times
        // as well, when its nodes change.
        nodesChanged: function () {

            widgetStyleNodes = widget.getAllStyleNodes();
            for (var i = 0, len = widgetStyleNodes.length; i < len; i++) {
                if (widgetStyleNodes[i]._U_backupCssText === undefined)
                {
                    widgetStyleNodes[i]._U_backupCssText = widgetStyleNodes[i].style.cssText;
                }
            }
 
            mapEvents(widget);
            widget.registerForSelectionEvents();
        },
        render:                            // Renders the widget.                  Used from uluv.
            function (placeholder) {
                this.preRender(placeholder);
                this.doRender(placeholder);
                this.postRender(placeholder);

                this.nodesChanged();
            },
        setProperties:                     // Sets widget properties.              Used from uluv.
            function () {
                restoreHtmlProperties(this, widgetBackupHtmlProps);
                restoreAttributeProperties(widget, widgetBackupAttProps); // @c30088
                restoreStyleProperties(widgetStyleNodes);
                var props = this.callBack.getCalculatedProperties();
                widgetBackupHtmlProps = {};
                setHtmlProperties(this, props, widgetBackupHtmlProps);
                setAttributeProperties(widget, props, widgetBackupAttProps);// @c30088
                setStyleProperties(this, props);
                setUnifaceProperties(this, props);
                if (this.setSyntax) {
                    this.setSyntax();
                }
                if (this.setClasses) {
                    this.setClasses();
                }

                // Give widget a chance too...
                if (typeof (l_setProps) === "function") {
                    l_setProps.call(this);
                }
            }
    });
    return widget;
}

return {
    addCreator: function (widgetClassName, widgetCreator) {
    },
    create : function(widgetClassName) {
        "use strict";
        var Creator = widgetCreators[widgetClassName];
        if (Creator === undefined) {
            /*jslint evil: true */
            Creator = createConstructor(eval(widgetClassName), widgetClassName);
            widgetCreators[widgetClassName] = Creator;
        }
        if (Creator == undefined) { // pragma(allow-loose-compare)
            UNIFACE.throwException("No widget creator found for " + widgetClassName + ". Are you missing a Javascript include?");
        }
        var widget = new Creator();
        if (!widget) {
            UNIFACE.throwException("Creation of \"" + widgetClassName + "\" widget for " +/* callBack.getId() +*/ " failed.");
        }
        return createWrapper(widget);
    }
};
    
})();

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget
// Namespace.
///////////////////////////////////////////////////////////////////////////////
UNIFACE.widget = function() {};

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.AbstractWidget
// Base class widget implementation.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.AbstractWidget = function() {
    this.blocked = false;
    this.hasMousedown = false;
};

UNIFACE.widget.AbstractWidget.prototype = {
    setValue : function(aVal) {},
    getValue : function() {    return ""; },
    mapEvents : function() {},
    getElement : function() { return null; },
    preRender : function() {},
    doRender : function() {},
    registerForSelectionEvents : function() {}
};

UNIFACE.widget.AbstractWidget.prototype.setCssProperty = function(aStyle, aProp, aValue, aPriority) {
    if ( aStyle[aProp] !== aValue ) {
        if ( aPriority != null ) { // pragma(allow-loose-compare)
            if ( typeof aStyle.setProperty === "function" ) {
                aStyle.setProperty(aProp, aValue, aPriority);
            } else {
                aStyle.cssText += ";" + aProp + ":" + aValue + "! " + aPriority + ";";
            }
        } else {
            aStyle[aProp] = aValue;
        }
    }
};

UNIFACE.widget.AbstractWidget.prototype.setClasses = function () {
    var el = this.getElement(),
        props;
    if (el) {
        props =this.callBack.getCalculatedProperties();
        el.className = props.mergeClasses(el.className, this._prevClasses || {});
        this._prevClasses = props.classes;
    }
};

// @c30088 by default, widgets ignore custom HTML properties.
UNIFACE.widget.AbstractWidget.prototype.setAttributeProp = _uf.nop;
        
UNIFACE.widget.AbstractWidget.prototype.setHtmlProp = function(aProp, aValue) {
    var oldValue;
    try {
        var element = this.getElement();
        if (element) {
            oldValue = element[aProp];
            element[aProp] = aValue;
        }
    } catch ( e ) {  // happen for ie6
        //oldValue = null;
    }
    return oldValue;
};

UNIFACE.widget.AbstractWidget.prototype.getStyleNode = function(aProp) {
    return this.getElement();
};

UNIFACE.widget.AbstractWidget.prototype.setStyleProp = function(aProp, aValue) {
    try {
        var styleNode = this.getStyleNode(aProp);
        this.setCssProperty(styleNode.style, aProp, aValue);
    } catch ( e ) {  // happen for ie6
        // ignore;
    }
};
UNIFACE.widget.AbstractWidget.prototype.postRender = function(a_placeHolder) {
    this.setValue(this.callBack.getValue());
};
UNIFACE.widget.AbstractWidget.prototype.getAllStyleNodes = function() {
    return [this.getElement()];
};

/**
 * Check if the user events are blocked.
 */
UNIFACE.widget.AbstractWidget.prototype.isBlocked = function() {
    return (this.blocked && !this.hasMousedown);
};

/**
 * Block or unblock the user events.
 */
UNIFACE.widget.AbstractWidget.prototype.setBlocked = function(b) {
    this.blocked = b;
    if ( !b ) {
        this.hasMousedown = false;
    }
};

UNIFACE.widget.AbstractWidget.prototype.addListener = function(source, eventName, f, eventPhase) {
    if ( !f ) {
        return;
    }

    var w = this;
    var _f;
    if ( eventName === "onChange" ) {
        _f = f;
    } else if ( eventName === "onClick" ) {
        _f = function(){
            if ( !w.isBlocked() ) {
                if ( w.hasMousedown ) {
                    w.hasMousedown = false;
                }
                f.apply(this, arguments);
            }
        };
    } else {
        _f = function(){
            if ( !w.isBlocked() ) {
                f.apply(this, arguments);
            }
        };
    }
    // Give the source an attribute that gives
    // access to the widget's callBack.
    if (!source.widgetCallback) {
        source.widgetCallback = this.callBack;
    }
    UNIFACE.addListener(source, eventName, _f, eventPhase);
};

var g_helperNode;
///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.AbstractWidget.prototype.accesskey
// Removes the UNIFACE % signs from the string and fills in the accessKey
// member which can be used by the widget to set the access key.
// Parameters:
// labelString - string containing % signs
// bSupportsAccess - Some widgets do not support accesskeys (dropdown/listbox)
//                   but % should be removed.
// bAsHTML         - Return string as HTML to under accelerator char.
///////////////////////////////////////////////////////////////////////////////
UNIFACE.widget.AbstractWidget.prototype.accesskey = function(labelString,bSupportsAccess,bAsHTML) {
  var str = null;

  if (bAsHTML) {
      if (g_helperNode === undefined) {
          g_helperNode = document.createElement("div");
          g_helperNode.style.display = "none";
          document.body.appendChild(g_helperNode);
      }
      var l_text = document.createTextNode(labelString);

      g_helperNode.innerHTML = "";
      g_helperNode.appendChild(l_text);
      str =  g_helperNode.innerHTML;
  } else {
      str =labelString;
  }
  this.ackey = 0; //remember for rendering
  var me = this;

  return str.replace(/%(.)/g, function(aMatch, aChar) {
        if (me.ackey===0 && /[a-zA-Z]/.test(aChar)) {
            me.ackey = aChar;
            if (bAsHTML){
                return "<u>" + aChar + "</u>";
            }
        }
        return aChar;
    }
  );
};


UNIFACE.widget.Props = _uf.ui ? _uf.ui.Props : _uf.nop;

UNIFACE.widget.AbstractWidget.prototype.blockedProperties = new UNIFACE.widget.Props( {"style:cursor": "progress", "html:disabled":"true"});

UNIFACE.widget.AbstractWidget.prototype.getBlockedProperties = function() {
    return this.blockedProperties;
};

if (typeof(UNIFACE.widgetOverrides) === "function") {
    UNIFACE.widgetOverrides();
}

}());
// %fv: uhtmlcontrols.js-99:ascii:1 % %dc: Fri Sep  4 15:33:48 2015 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
090205 c27248    9.ajax  jdk acceskeys do not work & labels etc show the %sign
090305 c27328    9.ajax  fd  Move common code up in widget class inheritance tree
100510 c28359    9.5.01  jnz Added timer widget based on genericHTML wodget
101228 c28644    9.5.01  jnz Removed the timer widget
110216 c28659    9.5.c1  jnz Apply toString to parameters which are not strings
140409 c30083    10.1.01 sse Mark empty occurrence with -uocc-empty- style
140422 c30104    10.1.01 sse Mark empty entity with -uent-empty- style
140602 c30088    mx05    tsk Add custom HTML properties mapping to HTML attributes
date   refnum    version who description
*******************************************************************************/

/*global UNIFACE document _uf setImmediate*/

(function () {


    var g_supported_input_types = (function(props) {

        var inputElem = document.createElement('input'),
            inputs = {},
            smile = ':)',
            docElement = document.documentElement;

        for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                        docElement.appendChild(inputElem);
                        defaultView = document.defaultView;

                        bool =  defaultView.getComputedStyle &&
              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                                                                  (inputElem.offsetHeight !== 0);

                        docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                        bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                        bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));


var RESOURCEINDICATOR = "_GET_RESOURCE_?RESOURCENAME=";

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.element
// The plain HTML widget base class.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.element = function() {
    // Call base class
    UNIFACE.widget.AbstractWidget.apply(this, arguments);
    this.ackey = 0; // @access remember for rendering
    this.controlType = "text";
    this.element = null;
    this.parent = null;
    this.tagName = "span";
};

UNIFACE.widget.element.vsn = "9.7/1";
UNIFACE.widget.element.prototype = new UNIFACE.widget.AbstractWidget();

UNIFACE.widget.element.prototype.getElement = function() {
    return this.element;
};

UNIFACE.widget.element.prototype.doRender = function(a_placeHolder) {
    this.parent = a_placeHolder.parentNode;
    this.element = this.createElement(a_placeHolder);
    this.fillAttributes();
    this.element.id = this.callBack.getId();
    this.setElementValue(this.callBack.getValue());
    this.element.style.cssText = a_placeHolder.style.cssText;
    this.parent.replaceChild(this.element, a_placeHolder);
    this.fillStyles();
};

UNIFACE.widget.element.prototype.setElementValue = function(aVal) {
    this.element.value = aVal;
};

UNIFACE.widget.element.prototype.setValue = function(aVal) {
    // Cache the value if element was not rendered yet....
    if (this.element) {

        this.setElementValue(aVal);
    }
};

UNIFACE.widget.element.prototype.getValue = function() {
    if (this.element) {
        return this.element.value;
    } else {
        return this.callBack.getValue();
    }
};

UNIFACE.widget.element.prototype.fillAttributes = function() {
};

UNIFACE.widget.element.prototype.fillStyles = function() {
};

UNIFACE.widget.element.prototype.createElement = function (a_placeHolder) {
    if (a_placeHolder.tagName.toLowerCase() == this.tagName) {
        return a_placeHolder.cloneNode(true);
    } else {
        return document.createElement(this.tagName);
    }
};

// @c30088 All widgets based on a plain element implementation will map html: properties to attributes on that element.
UNIFACE.widget.element.prototype.setAttributeProp = function(aProp, aValue) {
    var oldValue;
    var element = this.getElement();
    if (element) {
        var l_node = element.getAttributeNode(aProp);
        oldValue = l_node && l_node.specified ? l_node.value : undefined;
        try { // ie up to 8 does not accept changes to certain attributes....
            if (aValue === undefined) {
                element.removeAttribute(aProp);
            }
            else {
                element.setAttribute(aProp, aValue);
            }
        }
        catch (e) {
        }
    }

    return oldValue;
};

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.genericHTML
// The generic HTML widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.genericHTML = function() {
    UNIFACE.widget.element.apply(this, arguments);
    this._value = null;    // Private by convention (not by nature).
};

UNIFACE.widget.genericHTML.prototype = new UNIFACE.widget.element();

UNIFACE.widget.genericHTML.prototype.blockedProperties = new UNIFACE.widget.Props({ "style:cursor": "progress" });

UNIFACE.widget.genericHTML.prototype.setValue = function(aVal) {
    this._value = aVal;
};
    
UNIFACE.widget.genericHTML.prototype.getValue = function() {
    return this._value;
};

UNIFACE.widget.genericHTML.prototype.doRender = function(aPlaceholder) {
    this.element = aPlaceholder;   // Already 'rendered'.
};

UNIFACE.widget.genericHTML.prototype.postRender = function() {
};

UNIFACE.widget.genericHTML.prototype.mapEvents = function() {

    UNIFACE.widget.element.prototype.mapEvents.apply(this, arguments);

    // There is no natural mapping for which event to map to "detail".
    // Therefore onclick and ondblclick are mapped like this:
    var l_evs = this.callBack.getEvents();
    this.addListener(this.element, "ondblclick",    l_evs.ondblclick);
    this.addListener(this.element, "onclick",       l_evs.onclick   );
    this.addListener(this.element, "oncontextmenu", l_evs.oncontextmenu);
    this.addListener(this.element, "oncontextmenu", l_evs.onclick   );
    this.addListener(this.element, "onfocus",       l_evs.onfocus   );
    this.addListener(this.element, "onblur",        l_evs.onblur    );
    this.addListener(this.element, "onkeypress",    l_evs.onkeypress);
    this.addListener(this.element, "onchange",      l_evs.onchange);
//    this.addListener(this.element, "onscroll",      l_evs.onscroll);
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.genericHTML", UNIFACE.widget.genericHTML);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.occurrence
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.occurrence = function() {
    UNIFACE.widget.genericHTML.apply(this, arguments);
    this._value = null;    // Private by convention (not by nature).
};

UNIFACE.widget.occurrence.prototype = new UNIFACE.widget.genericHTML();

UNIFACE.widget.occurrence.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    // The'onselect' is called in the PRE_CLUSTERING phase, because we want any
    // selection change to happen before any triggers are fired.
    // The 'onselectionchange' is called in the CAPTURING phase,
    // because we want that trigger to be called *before* other triggers
    // such as detail and onclick.

    // The left-click:
    this.addListener(this.element, "onclick", l_evs.onselect, UNIFACE.eventPhase.PRE_CLUSTERING);
    this.addListener(this.element, "onclick", l_evs.onselectionchange, UNIFACE.eventPhase.CAPTURING);
    //  The right-click:
    this.addListener(this.element, "oncontextmenu", l_evs.onselect, UNIFACE.eventPhase.PRE_CLUSTERING);
    this.addListener(this.element, "oncontextmenu", l_evs.onselectionchange, UNIFACE.eventPhase.CAPTURING);
    
    // Drag-and-drop support.
    // Both the dragstart and the drop events have a handler that executes in
    // the PRE_CLUSTERING phase; implicit currency and selection changes need to happen
    // before any triggers are fired.

    // The drag:
    if (this.callBack.getDefProperty("occdragtype")) {
        this.addListener(this.element, "ondragstart", l_evs.ondraginit,  UNIFACE.eventPhase.PRE_CLUSTERING);
        this.addListener(this.element, "ondragstart", l_evs.onselectionchange, UNIFACE.eventPhase.CAPTURING);
        this.addListener(this.element, "ondragstart", l_evs.ondragstart);
        this.addListener(this.element, "ondragend", l_evs.ondragend);
    }
    // The drop:
    if (this.callBack.getDefProperty("occdroptype")) {
        // Note: the "ondragover" event has no associated trigger,
        // but the generic framework (see ulocal.js) requires a listener for the event.
        this.addListener(this.element, "ondragover", function() {});
        this.addListener(this.element, "ondrop", l_evs.onselectionchange, UNIFACE.eventPhase.CAPTURING);
        this.addListener(this.element, "ondrop", l_evs.ondropinit,  UNIFACE.eventPhase.PRE_CLUSTERING);
        this.addListener(this.element, "ondrop", l_evs.ondrop);
    }
};

UNIFACE.widget.occurrence.prototype.postRender = function() {
    // Occurrences that have the occdragtype property should be draggable.
    if (this.callBack.getDefProperty("occdragtype")) {
        this.element.draggable = true;
    }
};

UNIFACE.widget.occurrence.prototype.stateProps = {
    // to mark specific states using a class
    "plain": new UNIFACE.widget.Props({ "class:-uocc-": "true" }),
    "empty": new UNIFACE.widget.Props({ "class:-uocc-empty-": "true" }),
    "current": new UNIFACE.widget.Props({ "class:-uocc-cur-": "true" }),
    "selected": new UNIFACE.widget.Props({ "class:-uocc-sel-": "true" })
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.occurrence", UNIFACE.widget.occurrence);


///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.entity
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.entity = function() {
    UNIFACE.widget.genericHTML.apply(this, arguments);
    this._value = null;    // Private by convention (not by nature).
};

UNIFACE.widget.entity.prototype = new UNIFACE.widget.genericHTML();

function _setXY()
{
    this.x = -this.el.scrollLeft;
    this.y = -this.el.scrollTop;

    if (this.el == document.documentElement )
    {
        this.x = this.x || -window.scrollX;
        this.y = this.y || -window.scrollY;
        this.maxScrollY = _uf.ui.bodyHeight() - this.el.scrollHeight;
    //console.log("_setXY;heights " + ',' +  _uf.ui.bodyHeight()  + ',' + this.el.scrollHeight);
    }
    else
    {
        this.maxScrollY = this.el.clientHeight - this.el.scrollHeight;
    ////console.log("_setXY;heights " + ',' +  this.el.clientHeight + ',' + this.el.scrollHeight);
    }
    if (this.maxScrollY >= 0)
    {
        this.maxScrollY = 0;
    }
    this.maxScrollX = this.el.clientWidth - this.el.scrollWidth;
    if (this.maxScrollX >= 0)
    {
        this.maxScrollX = 0;
    }
    //console.log("_setXY; " + this.x + ',' + this.y + ',' + this.maxScrollX + ',' + this.maxScrollY);
}

function _onscroll()
{
    //console.log("_onscroll");
    _setXY.call(this);
    if (this._sto)
    {
        clearTimeout(this.sto);
    }
    if (this._scrollF)
    {
        this._sto = setTimeout(this._scrollF, 300);
    }
}


function UfScroller(el, props)
{
    this.el = el;
    UNIFACE.addListener(el === document.documentElement ? window : el, "onscroll", UNIFACE.bind(_onscroll, this));
}

UfScroller.prototype = {
    on : function(ev, f)
    {
        if (ev === "scrollEnd")
        {
            this._scrollF = f;
        }
    },
    useScrollTop : true,
    refresh : _setXY,
    y : 0, x: 0, maxScrollX : 0, maxScrollY: 0
};

UNIFACE.widget.entity.prototype.doRender = function(aPlaceholder) {
    if (this.callBack && this.callBack.useDataScrolling()) {
//        try {
            this.bodyscroll = aPlaceholder.getAttribute("data-uniface-scroll") === "body";
            if (this.bodyscroll)
            {
                aPlaceholder.style.display = "block";
            }

            //this.Text = "MYTEXT";
            var l_parent = aPlaceholder.parentNode;
            var me = this;
            this.element = document.createElement("div");

            this.vp = aPlaceholder;

            // Remove position/size-related styles from viewport
            this.vp.style.position = "relative";
            this.vp.style.top = "0px";
            this.vp.style.left = "0px";

            this.vp.style.width = "";
            this.vp.style.height = "";

            // TODO: get a good model for this.

            this.orEl = aPlaceholder;
            this.pel = document.createElement("div");
            this.pel.style.height = "0px";
            this.pel.style.visibility = "hidden";

            this.tophglass = document.createElement("div");
            this.tophglass.style.height = "32px";
            this.tophglass.style.display = "none";
            this.tophglass.style.background = "url('../common/images/ubusyindicator/ajax-loader.gif') no-repeat center center";

            this.bottomhglass = document.createElement("div");
            this.bottomhglass.style.height = "32px";
            this.bottomhglass.style.display = "block";
            this.bottomhglass.style.background = "url('../common/images/ubusyindicator/ajax-loader.gif') no-repeat center center";

            this.soffset = 0;

            this.sstart = 0;
            this.send = 100;
            //this.element.style.overflow = "auto";
            l_parent.replaceChild(this.element, aPlaceholder);

            this.element.appendChild(this.vp);
            this.vp.insertBefore(this.pel, this.vp.firstChild);
            this.vp.appendChild(this.bottomhglass);
            //this.vp.appendChild(this.orEl);
            this.element.style.height = this.orEl.style.height;
            this.orEl.style.height = "";

            if (this.bodyscroll )
            {
                if  (_uf.ui.body_scroller.style && _uf.ui.body_scroller.style.setProperty)
                {
                    _uf.ui.body_scroller.style.setProperty("-webkit-overflow-scrolling", "touch", "");
                }
            }
            else
            {
                this.element.style.position="absolute";
                this.element.style.top = this.element.style.left = this.element.style.bottom = this.element.style.right = 0;
                if (this.element.style.setProperty)
                {
                    this.element.style.setProperty("-webkit-overflow-scrolling", "touch");
                }
            }
            me.scroller = new UfScroller(this.bodyscroll ? _uf.ui.body_scroller : this.element, {
                mouseWheel: true,
                scrollbars: true,
                click: true
            });
            if (me.scroller)
            {
                if (me.scroller.useScrollTop) {
                    this.element.style.overflowY = "auto";
                    //this.element.style.overflowX = "hidden";
                }
            }
    }
    else {
        UNIFACE.widget.genericHTML.prototype.doRender.apply(this, arguments);
    }
};


UNIFACE.widget.entity.prototype.setValue = function(a_value) {
    if (this.callBack.getValue() === "complete")
    {
        this.complete = true;
        this.bottomhglass.style.display = "none";
    }
    this.body_onresize();
};

UNIFACE.widget.entity.prototype.onScroll = function(evt) {
    _setXY.call(this.scroller);
    if (!this.isBlocked() && !this.complete && this.scroller.y < this.scroller.maxScrollY + 1 + this.bottomhglass.clientHeight) {
        this.callBack.nextPage();
        this.scroller.refresh();
    }
};


UNIFACE.widget.entity.prototype.body_onresize = function() {
    if (this.callBack.useDataScrolling()) {
        if (this.scroller && this.scroller.refresh) 
        {
            this.scroller.refresh();
        }
        // Use settimout since the page may be blocked if we get here after a setValue
        var me=this;
        setImmediate(function(){
            me.onScroll();
        });
    }
};
/*
UNIFACE.widget.entity.prototype.onfocusin = function(ev) {
    setTimeout(UNIFACE.bind(this.dofocusin, this) ,0, ev);
};

UNIFACE.widget.entity.prototype.dofocusin = function(ev) {
    if (this.scroller && !this.scroller.useScrollTop) {
        var l_node = ev.target;

        while (l_node && l_node !== this.element) {
            l_node = l_node.parentNode;
        }
        if (l_node) {
            var
                l_r = ev.target.getBoundingClientRect(),
                l_c = this.element.getBoundingClientRect();
            if (l_r.bottom - l_c.top + this.element.scrollTop > l_c.height) {
                this.scroller.scrollTo(0, -this.element.scrollTop);
            }
            else if (l_r.top - l_c.top + this.element.scrollTop < 0) {
                this.scroller.scrollTo(0, -this.element.scrollTop);
            }
            this.element.scrollTop = 0;
        }
    }
};
*/
UNIFACE.widget.entity.prototype.mapEvents = function() {
    UNIFACE.widget.genericHTML.prototype.mapEvents.apply(this, arguments);
    /*UNIFACE.addListener(document.body, "onfocusin", UNIFACE.bind(this.onfocusin, this));
    UNIFACE.addListener(document.body, "onDOMFocusIn", UNIFACE.bind(this.onfocusin, this));
    UNIFACE.addListener(document.body, "onfocus", UNIFACE.bind(this.onfocusin, this), UNIFACE.eventPhase.CAPTURING);
    UNIFACE.addListener(document.body, "onDOMActivate ", UNIFACE.bind(this.onfocusin, this));
    */
    UNIFACE.addListener(window, "onresize", UNIFACE.bind(this.body_onresize, this));

    if (this.scroller) {
        this.scroller.on('scrollEnd', UNIFACE.bind(this.onScroll, this));
    }

    var l_evs = this.callBack.getEvents();
    // The drag:
    if (this.callBack.getDefProperty("entdragtype")) {
        this.addListener(this.element, "ondragstart", l_evs.ondragstart);
        this.addListener(this.element, "ondragend", l_evs.ondragend);
    }
    // The drop:
    if (this.callBack.getDefProperty("entdroptype")) {
        // Note: the "ondragover" event has no associated trigger,
        // but the generic framework (see ulocal.js) requires a listener for the event.
        this.addListener(this.element, "ondragover", function() {});
        this.addListener(this.element, "ondrop", l_evs.ondrop);
    }
};

UNIFACE.widget.entity.prototype.postRender = function() {
    // Entities that have the entdragtype property should be draggable.
    if (this.callBack.getDefProperty("entdragtype")) {
        this.element.draggable = true;
    }
};

UNIFACE.widget.entity.prototype.stateProps = {
    // to mark specific states using a class
    "plain": new UNIFACE.widget.Props({ "class:-uent-": "true" }),
    "empty": new UNIFACE.widget.Props({ "class:-uent-empty-": "true" })
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.entity", UNIFACE.widget.entity);



///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.label
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.label = function() {
    // Call base class
    UNIFACE.widget.element.apply(this, arguments);
    this.tagName = "label";
};

UNIFACE.widget.label.prototype = new UNIFACE.widget.element();

UNIFACE.widget.label.prototype.setElementValue = function(aValue) {
    this.element.value = aValue;
    // Set the label's value, as defined in the label definition.
    this.element.innerHTML = aValue;
};

UNIFACE.widget.label.prototype.setValue = function(aVal) {
    this._value = aVal;
    if (this.element) {
        this.setElementValue(this.accesskey(aVal, true, true));
    }
};

UNIFACE.widget.label.prototype.getValue = function() {
    return this._value;
};

UNIFACE.widget.label.prototype.postRender = function() { //@access
};

UNIFACE.widget.label.prototype.doRender = function(aPlaceholder) {
    this.associatedId = "ufld:" + this.callBack.getId().replace(/^ulbl:/, "");
    this.parent = aPlaceholder.parentNode;
    if (aPlaceholder.tagName.toLowerCase() == "label") {
        this.element = aPlaceholder;
    } else {
        this.element = document.createElement("label");
        this.parent.replaceChild(this.element, aPlaceholder);
    }
    // Associate the label with the appropriate field, if applicable.
    if (this.associatedId != undefined) { // pragma(allow-loose-compare)
        this.element.htmlFor = this.associatedId;
    }
    if (this.ackey !== 0) {
        this.element.accessKey = this.ackey;
    }
    this.setElementValue(this.accesskey(this.callBack.getValue(), true, true));

};


UNIFACE.widget.label.prototype.mapEvents = function() {
    // No events to be mapped!
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.label", UNIFACE.widget.label);

// Private: base class for 'changeable' widgets
function Changeable() {
    UNIFACE.widget.element.apply(this, arguments);
}

Changeable.prototype = new UNIFACE.widget.element();

Changeable.prototype.mapEvents = function() {
    UNIFACE.widget.element.prototype.mapEvents.apply(this, arguments);
};

Changeable.prototype.handleChangeEvent = function() {
    // This can handle change events from descendent widgets
};

// @c30088 the widget itself uses the value and type attributes: do not map them to properties.
Changeable.prototype.setHtml_value = _uf.nop;
Changeable.prototype.setHtml_type = _uf.nop;

function Editable() {
    return Changeable.apply(this, arguments);
}

Editable.prototype = new Changeable();




function editableOnChange() {
    var l_checkValueResult;
    var l_different;

    // Do not suppress OnSyntaxError trigger (2nd param here)
    l_checkValueResult = this.callBack.checkValue(this.getValue(), false);

    l_different = (l_checkValueResult.originalValue !== l_checkValueResult.newValue);
    if (!l_checkValueResult.error && l_different) {
        this.setElementValue(l_checkValueResult.newValue);
    }

    // ALEX: The following code needs review by Thomas.
    // Our thesis (which is not implemented here) is that client side webtriggers should always be called.
    // At the moment, a distinction between webtriggers and serverside triggers that have been made available via 'public web'
    // is only made in the RequestScope object a couple of layers below this (in the requesttype variable).
    // We can't distinguish them here or anywhere else in the widgets. It would be good here if we could
    // still call a webtrigger even if we are preventing data being sent to the server (in accordance with 'Syntax Check on Browser' setting).
    if ((!l_checkValueResult.error) || (l_checkValueResult.error && !this.callBack.getSyntaxCheckEnabled())) {
        var l_evs = this.callBack.getEvents();
        l_evs.onchange();
    }

    this.handleChangeEvent(); // In Changeable's prototype
    return true;
};

Editable.prototype.mapEvents = function () {
    Changeable.prototype.mapEvents.call(this);
    var l_evs = this.callBack.getEvents();
    this.addListener(this.element, "ondblclick", l_evs.detail);
    this.addListener(this.element, "oninput", l_evs.onedit);
    this.addListener(this.element, "onchange", UNIFACE.bind(editableOnChange, this));
};

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.input
// The HTML text box.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.input = function() {
    // Call base class
    this.formatter = _uf.format.nullFormatter;
    this.valueAtt = "value";
    Editable.apply(this, arguments);
    this.controlType = "text";
    this.tagName = "input";
};

UNIFACE.widget.input.prototype = new Editable();

// On IE8, changing the type property of an html input element when that element is
// already part of the DOM causes an exception. This check will
// indicate whether it is possible to change the type property for a particular type or not.
UNIFACE.widget.input.prototype.canChangeTypeWhenInDOM = function(fromType, toType) {
    var dummyInput = document.createElement('input');
    dummyInput.style.visibility = 'hidden';
    dummyInput.type = fromType;
    var dummyDiv = document.createElement('div');
    dummyDiv.style.visibility = 'hidden';
    dummyDiv.appendChild(dummyInput);
    document.documentElement.appendChild(dummyDiv);
    try {
        dummyInput.type = toType;
        return true;
    } catch (e) {
        return false;
    }
};

UNIFACE.widget.input.prototype.setElementValue = function (aVal) {
    this.element[this.valueAtt] = this.formatter.format(aVal);
};

UNIFACE.widget.input.prototype.getValue = function () {
    if (this.element) {
        return this.formatter.deformat(this.element[this.valueAtt]);
    } else {
        return this.callBack.getValue();
    }
};

UNIFACE.widget.input.prototype.createElement = function (a_placeHolder) {
    if (this.callBack.getCalculatedProperties().att.type)
    {
        this.controlType = this.callBack.getCalculatedProperties().att.type.toLowerCase();
    }

    if (a_placeHolder.tagName.toLowerCase() == this.tagName && a_placeHolder.type == this.controlType) {
        return a_placeHolder.cloneNode(true);
    } else {
        return document.createElement(this.tagName);
    }
};

UNIFACE.widget.input.prototype.setHtml_disabled = function(a_dis) {
    this.element.disabled = typeof (a_dis) == "string" && a_dis.toLowerCase() === "true";
};

UNIFACE.widget.input.prototype.setHtml_type = function(a_dis) {
    var oldValue = this.element.type;
    var unParented = this.element.parentElement === null;
    /*
    if (unParented) {
        console.log('Convert unparented ' + oldValue + ' to ' +a_dis);
    } else {
        console.log('Convert parented ' + oldValue + ' to ' + a_dis);
    }
    */

    if ((!a_dis) && (this.controlType)) {
        a_dis = this.controlType;
    }
    a_dis = (a_dis || "");
    var l_supported = g_supported_input_types[a_dis.toLowerCase()];
    if (l_supported === false) {
        if (unParented || this.canChangeTypeWhenInDOM(oldValue, 'text')) {
            //console.log('FAIL: Defaulting to text because the conversion seems to be unsupported.');
            var l_syn = this.callBack.getCalculatedProperties().syntax;
            if (!this.formatter || this.displayFormat !== l_syn.DIS) {
                this.formatter = _uf.format.createFormatter(l_syn.DIS, a_dis);
                this.displayFormat = l_syn.DIS;
            }

            this.element.type = this.controlType = "text";
        } else {
            //console.log('FAIL: The conversion is unsupported, and could not even default to text.');
        }
    }
    else {
        if (unParented || this.canChangeTypeWhenInDOM(oldValue, a_dis.toLowerCase())) {
            //console.log('PASS: Converting from ' + oldValue + ' to ' + a_dis);
            a_dis = (a_dis || "text");
            this.element.type = this.controlType = a_dis.toLowerCase();

            // ALEX T: Review following code with Thomas, re: why no display formatting here?
            if (a_dis.toLowerCase() === 'checkbox') {
                this.formatter = _uf.format.createFormatter('', a_dis);
            } else {
                this.formatter = _uf.format.nullFormatter;
            }

            this.displayFormat = undefined;
        } else {
            //console.log('FAIL: in list of supported types, but could not convert from ' + oldValue + ' to ' + a_dis);
        }
    }
    if (this.controlType == "checkbox" || this.controlType == "radio")
    {
        this.valueAtt = "checked";
    }
    else
    {
        this.valueAtt = "value";
    }
    return oldValue;
};

UNIFACE.widget.input.prototype.setHtml_placeholder = function (a_plh) {
    this.setHtml_type(this.callBack.getCalculatedProperties().att.type);
    this.element.placeholder = this.formatter.format(a_plh);
};

UNIFACE.widget.input.prototype.fillAttributes = function () {
    this.setHtml_type(this.controlType);
};

UNIFACE.widget.input.prototype.mapEvents = function () {
    Editable.prototype.mapEvents.call(this);
    var l_evs = this.callBack.getEvents();
    if (this.controlType === "button") {
        this.addListener(this.element, "onclick", l_evs.detail);
    }
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.input", UNIFACE.widget.input);


///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.multilinebox
// The HTML multi-line text box.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.multilinebox = function() {
    Editable.apply(this, arguments);
    this.tagName = "textarea";
};

UNIFACE.widget.multilinebox.prototype = new Editable();

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.multilinebox", UNIFACE.widget.multilinebox);


///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.editbox
// The HTML single-line edit box.
////////////////////////////////////////////////UNIFACE.widget.editbox///////////////////////////////
UNIFACE.widget.editbox = UNIFACE.widget.input;
UNIFACE.widgetFactory.addCreator("UNIFACE.widget.editbox", UNIFACE.widget.editbox);
        
///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.img
// The HTML image control.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.img = function() {
    // Call base class
    UNIFACE.widget.element.apply(this, arguments);
    this.tagName = "img";
};

UNIFACE.widget.img.prototype = new UNIFACE.widget.element();

UNIFACE.widget.img.prototype.createElement = function(a_placeHolder) {
    var syntax = this.callBack.getCalculatedProperties().syntax;
    var isPromptable = syntax.YPR || !syntax.NPR;
    // If the field is 'promptable' then create an anchor with an image inside;
    // otherwise just create an image.
    this.tagName = isPromptable ? "input" : "img";
    var element;
    if (a_placeHolder.tagName.toLowerCase() == this.tagName) {
        element = a_placeHolder.cloneNode(true);
    } else {
        element = document.createElement(this.tagName);
    }
    if (this.tagName == "input") {
        element.type = "image";
    }
    // IE 8 adds these attributes with values 700 and 600. Remove them.
    element.removeAttribute("height");
    element.removeAttribute("width");
    return element;
};

// @c30088 the widget itself uses the src and type attributes: do not map them to properties.
UNIFACE.widget.img.prototype.setHtml_type = _uf.nop;
UNIFACE.widget.img.prototype.setHtml_src = _uf.nop;

UNIFACE.widget.img.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    this.addListener(this.element, "onclick", l_evs.detail);
    if (l_evs.detail && this.tagName !== "input" && !this.element.style.cursor) {
        // Change the cursor to 'pointer', if it is not already set.
        this.element.style.cursor = "pointer";
    }
};

UNIFACE.widget.img.prototype.setElementValue = function(aVal) {
    var prevValue = this.getValue();
    if (prevValue !== undefined && aVal != prevValue) {
        // Clear the resource, in case it was previously set to something else (@CR27251).
        // Note: this assumes that, for images, setValue is called *before* setResource.
        this.setElementResource("broken://");
    }
    UNIFACE.widget.element.prototype.setElementValue.apply(this, arguments);
};

UNIFACE.widget.img.prototype.setElementResource = function(aRes) {
    if (this.element) {
        if (aRes) {
            var i = aRes.indexOf(RESOURCEINDICATOR);
            var j = (i < 0) ? -1 : this.element.src.indexOf(RESOURCEINDICATOR);
            if (i < 0 || j < 0 || aRes.substring(i + RESOURCEINDICATOR.length) != this.element.src.substring(j + RESOURCEINDICATOR.length)) {
                this.element.src = aRes;
            }
        } else {
            this.element.src = "broken://";
        }
    }
};

UNIFACE.widget.img.prototype.postRender = function() {
    this.setElementResource(this.resource);
    UNIFACE.widget.element.prototype.postRender.apply(this, arguments);
    // Vertically center the widget (the Dojo 1.3.2 widgets are also vertically centered...).
    this.getElement().style.verticalAlign = "middle";
};

UNIFACE.widget.img.prototype.setResource = function(aRes) {
    this.resource = aRes;
    this.setElementResource(aRes);
};

UNIFACE.widget.img.prototype.setValue = function(aVal) {
    UNIFACE.widget.element.prototype.setValue.apply(this, arguments);
    // When the server sets a value for an image widget it is always a value
    // of the form <char><something>, where char equals &, #, @ or ^.
    // This is related to where the actual image resides.
    // Such calls to setValue are always accompanied by calls to setResource,
    // which specifies the actual image location.
    //
    // In contrast, when the JavaScript API sets a value for an image widget,
    // it calls setValue with the actual image location and never calls
    // setResource at all.
    if (typeof (aVal) === "string" && aVal.length > 0) {
        var firstChar = aVal.charAt(0);
        if (firstChar !== '&' && firstChar !== '#' && firstChar !== '@' && firstChar !== '^') {
            var valrep = this.callBack.getValrep();
            if (valrep && valrep[0]) {
                aVal = valrep[0][aVal];
                if (aVal && aVal.charAt(0) === '&') {
                    aVal = aVal.substring(1);
                }
            }
            this.setResource(aVal);
        }
    }
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.img", UNIFACE.widget.img);

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.plain
// The HTML plain text control.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.plain = function() {
    // Call base class
    UNIFACE.widget.element.apply(this, arguments);
};

UNIFACE.widget.plain.prototype = new UNIFACE.widget.element();

UNIFACE.widget.plain.prototype.setUnifaceProp = function(a_prop, a_value) {
    if (a_prop === "rawhtml") {
        a_value = (a_value.toLowerCase() == "true"); // pragma(allow-loose-compare)
        if (this.isRawHTML != a_value) {
            this.isRawHTML = a_value;
            // Setting this property has effect on how the value is displayed.
            // Therefore redisplay the value, by calling setElementValue.
            this.setElementValue(this.element.value);
        }
    }
};

// @c30088 the widget itself uses the value and type attributes: do not map them to properties.
UNIFACE.widget.plain.prototype.setHtml_href = _uf.nop;

UNIFACE.widget.plain.prototype.createElement = function(a_placeHolder) {
    var syntax = this.callBack.getCalculatedProperties().syntax;
    var isPromptable = syntax.YPR || !syntax.NPR;
    // If the field is 'promptable' then create an anchor;
    // otherwise just create an span.
    this.tagName = isPromptable ? "a" : "span";
    var element;
    if (a_placeHolder.tagName.toLowerCase() == this.tagName) {
        element = a_placeHolder.cloneNode(true);
    } else {
        element = document.createElement(this.tagName);
    }
    if (this.tagName == "a") {
        element.href = "javascript://";
    }
    return element;
};

UNIFACE.widget.plain.prototype.setElementValue = function(aValue) {
    this.element.value = aValue;
    if (this.isRawHTML) {
        this.element.innerHTML = aValue;
    } else {
        this.element.innerHTML = "";
        if (typeof aValue !== "string")
        {
            aValue = aValue.toString();
        }
        var l_lines = aValue.split("\n");
        if (l_lines.length > 0) {
            this.element.appendChild(document.createTextNode(l_lines[0]));
        }
        for (var i = 1; i < l_lines.length; i++) {
            this.element.appendChild(document.createElement("br")); // preserve line breaks
            if (l_lines[i]) {
                this.element.appendChild(document.createTextNode(l_lines[i]));
            }
        }
    }
};

UNIFACE.widget.plain.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    this.addListener(this.element, "onclick", l_evs.detail);
    if (l_evs.detail && this.tagName !== "a" && !this.element.style.cursor) {
        // Change the cursor to 'pointer', if it is not already set.
        this.element.style.cursor = "pointer";
    }

    if (this.callBack.getDefProperty("flddragtype")) {
        this.addListener(this.element, "ondragstart", l_evs.ondragstart);
        this.addListener(this.element, "ondragend", l_evs.ondragend);
    }
    if (this.callBack.getDefProperty("flddroptype")) {
        // Note: the "ondragover" event has no associated trigger,
        // but the generic framework (see ulocal.js) requires a listener for the event.
        this.addListener(this.element, "ondragover", function() {});
        this.addListener(this.element, "ondrop", l_evs.ondrop);
    }
};

UNIFACE.widget.plain.prototype.postRender = function() {
    if (this.callBack.getDefProperty("flddragtype")) {
        this.element.draggable = true;
    }
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.plain", UNIFACE.widget.plain);

    ///////////////////////////////////////////////////////////////////////////////
    // UNIFACE.widget.select
    // The HTML select control.
    ///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.select = function () {
    // Call base class
    Changeable.apply(this, arguments);
    this.tagName = "select";
};

UNIFACE.widget.select.prototype = new Changeable();

UNIFACE.widget.select.prototype.setHtml_size = function (a_value) {
    var oldValue = this.element.value;
    this.element.size = a_value;
    // After a size change, the dropdown list resets its value to the first item. Undo that by properly setting the value.
    this.setValue(oldValue);
}

UNIFACE.widget.select.prototype.setValrep = function (aValrep) {
    if (!this.element) {
        return;
    }
    while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
    }

    if (!aValrep) {
        return;
    }

    var a;
    if (aValrep.constructor === Array) {
        for (a = 0; a < aValrep[1].length; a++) {
            var vr = document.createElement("option");
            vr.value = aValrep[1][a];
            //vr.text = aValrep[0][vr.value]; // FF
            vr.appendChild(document.createTextNode(aValrep[0][vr.value])); // IE
            this.element.appendChild(vr);
        }
    }
};

UNIFACE.widget.select.prototype.fillAttributes = function () {
    this.setValrep(this.callBack.getValrep());
};

UNIFACE.widget.select.prototype.mapEvents = function () {
    var l_evs = this.callBack.getEvents();
    // We have to use settimeout here, since internet explorer 11 crashes due to internal state 
    // of the listbox not being fully up-to-date.
    this.addListener(this.element, "onchange", function () { setTimeout(l_evs.onchange, 0); } );
};

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.radiogroup
// The HTML select control.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.radiogroup = function () {
    // Call base class
    Changeable.apply(this, arguments);
    this.tagName = "span";

    // We do not define the controlClass property here,
    // because the dojo RadioButton widgets should not be created by
    // the doRender function.  Instead, they are created by
    // UNIFACE.widget.radiogroup.insertRadio, which is called when
    // a new valrep is set.
    this.initialAttributes = {};
    this.layout = {
        cols: 0,
        rows: 0,
        verticalOrdering: false
    };
    this.control = {};
    this.controls = null;
    this.valueList = [];
};

UNIFACE.widget.radiogroup.prototype = new Changeable();


UNIFACE.widget.radiogroup.prototype.getAllStyleNodes = function () {
    var node,
        nodes = [this.getElement()];

    for (var l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
        nodes.push(this.controls[l_ctrl]);
        node = this.controls[l_ctrl].labelNode;
        if (node)  {
            nodes.push(node);
        }
    }
    return nodes;
};
    
UNIFACE.widget.radiogroup.prototype.isEmpty = function () {
    for (var ctrl in this.controls) if (this.controls.hasOwnProperty(ctrl)) {
        return false;
    }
    return true;
};

UNIFACE.widget.radiogroup.prototype.getStyleNode = function (aProp) {
    var styleNode;
    if (aProp === "textIndent" && !this.isEmpty()) {
        styleNode = this.control.labelNode.parentNode;
    } else {
        styleNode = this.getElement();
    }
    return styleNode;
};

UNIFACE.widget.radiogroup.prototype.setStyle_textIndent = function (value) {
    var ctrl;
    if (!this.isEmpty()) {
        for (ctrl in this.controls) if (this.controls.hasOwnProperty(ctrl)) {
            this.setCssProperty(this.controls[ctrl].labelNode.parentNode.style, "textIndent", value);
        }
    }
}

UNIFACE.widget.radiogroup.prototype.setStyle_cursor = function (value) {
    var ctrl;
    for (ctrl in this.controls) if (this.controls.hasOwnProperty(ctrl)) {
        this.setCssProperty(this.controls[ctrl].focusNode.style, "cursor", value);
        this.setCssProperty( this.controls[ctrl].labelNode.style, "cursor", value);
    }
    this.setCssProperty(this.element.style, "cursor", value);
}

UNIFACE.widget.radiogroup.prototype.setHtmlProp = function (aProp, aValue) {
    var oldValue;
    if (this.controls === null) {
        return oldValue;
    }
    var l_ctrl, l_val;
    var l_prop = aProp;
    if (aProp === "readOnly" || aProp == "disabled") {
        var l_props = this.callBack.getCalculatedProperties();
        l_val = l_props.html.disabled === "true" || l_props.html.readOnly === "true";
        l_prop = "disabled";
    }
    for (l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
            if (l_prop === "disabled") {
                oldValue = this.controls[l_ctrl][l_prop];
                this.controls[l_ctrl].disabled = l_val;
            } else {
                var element = this.controls[l_ctrl].focusNode;
                oldValue = element[aProp];
                element[aProp] = aValue;
            }
    }
    if (oldValue) {
        oldValue = oldValue.toString();
    }
    return oldValue;
};

UNIFACE.widget.radiogroup.prototype.doRender = function () {
    Changeable.prototype.doRender.apply(this, arguments);
    this.wrapperNode = this.element;
    this.initialAttributes.name = this.callBack.getId();
    this.setValrep(this.callBack.getValrep());
};


function insertRadio(aWidget, aValue, aTrElement, aAlign, aIndex) {
    var l_labelText; //@c27248
    var vTdElem1 = document.createElement("TD");
    vTdElem1.className = "unifaceRadioInput";
    aTrElement.appendChild(vTdElem1);
    var vElem = document.createElement("INPUT");
    vElem.type = "radio";
    vElem.value = aValue;
    vElem.name = aWidget.callBack.getId();
    vElem.id = vElem.name + ".l" + aIndex;
    vTdElem1.appendChild(vElem);

    var l_control = vElem;
    l_control.domNode = vElem;
    l_control.focusNode = vElem;
    l_control.domNode.style.cssText += ";display:-moz-inline-block"; // For -moz-inline-box problem
    aWidget.controls[aValue] = l_control;

    var vTdElem2 = document.createElement("TD");
    vTdElem2.className = "unifaceRadioLabel";
    aTrElement.appendChild(vTdElem2);

    vElem = document.createElement("LABEL");
    vElem.setAttribute("for", l_control.id);
    var valrep = aWidget.callBack.getValrep();
    l_labelText = aWidget.accesskey(valrep[0][aValue], true, true); //@c27248
    if (this.ackey !== 0) {                  //@c27248
        vElem.accessKey = aWidget.ackey;   //@c27248
    }
    vElem.innerHTML = l_labelText;
    // @c27248 vElem.appendChild(document.createTextNode(l_labelText)); //@c27248
    vTdElem2.appendChild(vElem);
    l_control.labelNode = vElem;

    if (aAlign && aAlign === "LEFT") {
        //vTdElem2.align="right";
        aTrElement.insertBefore(vTdElem2, vTdElem1);
    } else {
        aTrElement.appendChild(vTdElem2);
    }
}

UNIFACE.widget.radiogroup.prototype.setValrep = function (a_valrep) {
    if (!this.wrapperNode) {
        return;
    }

    // Kill the children
    this.wrapperNode.innerHTML = "";
    /*while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
    }*/
    this.controls = {};
    var a;
    if (typeof a_valrep !== 'object') {
        a_valrep = [{}, []];
    }

    var vValues = a_valrep[1];
    this.valueList = vValues;

    var cols = 0;
    var rows = 0;
    var verticalOrdering = false;

    var l_props = this.callBack.getCalculatedProperties();
    if (l_props) {
        l_props = l_props.uniface;
    }
    if (l_props) {
        if (l_props.columns) {
            try {
                cols = parseInt(l_props.columns, 10);
            } catch (e) {
                cols = 0;
            }
        }
        if (l_props.rows) {
            try {
                rows = parseInt(l_props.rows, 10);
            } catch (e1) {
                rows = 0;
            }
        }
        if (cols > 0) {
            if (rows > 0) {
                if (rows * cols < vValues.length) {
                    rows = Math.ceil(vValues.length / cols);
                }
            } else {
                rows = Math.ceil(vValues.length / cols);
            }
        } else if (rows > 0) {
            cols = Math.ceil(vValues.length / rows);
        } else {
            cols = 1;
            rows = vValues.length;
        }
        if (l_props.verticalorder === "true") {
            verticalOrdering = true;
        }
    }
    this.layout.cols = cols;
    this.layout.rows = rows;
    this.layout.verticalOrdering = verticalOrdering;
    this.control = {};
    var vElem = document.createElement("TABLE");
    vElem.className = "unifaceRadioGroup";
    this.control.domNode = vElem;
    vElem.style.cssText = "display:inline-table;";

    this.wrapperNode.appendChild(vElem);
    vElem = document.createElement("TBODY");
    this.control.domNode.appendChild(vElem);

    // Fill the array of indirect indices.
    var indices = [];
    var index = 0;
    var i, j, max;
    if (verticalOrdering) {
        var itemsInLastRow = vValues.length % cols;
        if (itemsInLastRow === 0) {
            itemsInLastRow = cols;
        }
        for (j = 0; j < cols; j++) {
            max = rows;
            if (j >= itemsInLastRow) {
                max--;
            }
            for (i = 0; i < max; i++) {
                indices[i * cols + j] = index++;
            }
        }
    } else {
        var itemsInLastColumn = vValues.length % rows;
        if (itemsInLastColumn === 0) {
            itemsInLastColumn = rows;
        }
        for (i = 0; i < rows; i++) {
            max = cols;
            if (i >= itemsInLastColumn) {
                max--;
            }
            for (j = 0; j < max; j++) {
                indices[i * cols + j] = index++;
            }
        }
    }

    // Create the rows of radio buttons.
    max = rows * cols;
    var vElem2;
    for (i = 0; i < max; i++) {
        if (i % cols === 0) {
            vElem2 = document.createElement("TR");
            vElem.appendChild(vElem2);
        }
        var vIndex = indices[i];
        if (vIndex != null && vIndex < vValues.length) { //@pragma(allow-loose-compare)
            insertRadio(this, vValues[vIndex], vElem2, l_props.align, vIndex);
        }
    }
    if (vValues.length > 0) {
        this.control.focusNode = this.controls[vValues[0]].focusNode;
        this.control.labelNode = this.controls[vValues[0]].labelNode;
    } else {
        this.control.focusNode = this.control.domNode;
        this.control.labelNode = this.control.domNode;
    }
    
    // The nodes of this widget have changed.
    this.nodesChanged();
};

// Get the valrep as it is according to the widget;
// that is: without consulting the callBack.
// This function is only intended for the purpose of testing.
UNIFACE.widget.radiogroup.prototype.getValrep = function () {
    var valrep = [{}, []];
    var i;
    for (i = 0; i < this.valueList.length; i++) {
        var value = this.valueList[i];
        var labelNode = this.controls[value].labelNode;
        if (labelNode.textContent) {
            valrep[0][value] = labelNode.textContent;     // FF
        } else if (labelNode.innerHTML) {
            valrep[0][value] = labelNode.innerHTML;       // IE
        } else {
            valrep[0][value] = labelNode.firstChild.nodeValue; // Last resort...
        }
        valrep[1][i] = value;
    }
    return valrep;
};

UNIFACE.widget.radiogroup.prototype.setValue = function (aVal) {
    this.value = aVal;
    if (this.controls) {
        this.applyValue();
    }
};

UNIFACE.widget.radiogroup.prototype.applyValue = function () {
    if (typeof this.controls[this.value] != 'undefined') {
        this.controls[this.value].checked = true;
    } else {
        var l_ctrl;
        for (l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
            this.controls[l_ctrl].checked = false;
        }
    }
};

UNIFACE.widget.radiogroup.prototype.getValue = function () {
    var l_ctrl;
    var l_val = this.value;
    for (l_ctrl in this.controls) {
        if (this.controls[l_ctrl].checked) {
            l_val = l_ctrl;
            break;
        }
    }
    return l_val;
};

function _radioGroupOnChange() {
    // if the original value === current value: suppress OnChange
    if ( this.valueBeforeChange !== this.getValue()) {
        this.callBack.getEvents().onchange();
        this.valueBeforeChange = this.getValue();
    }
}

UNIFACE.widget.radiogroup.prototype.mapEvents = function () {
    var l_evs = this.callBack.getEvents();
    for (var l_ctrl in this.controls) if (this.controls.hasOwnProperty(l_ctrl)) {
        this.addListener(this.controls[l_ctrl], "onclick", this.callBack.bind("onchange", _radioGroupOnChange));
    }
};

}());
// %fv: base.js-3:ascii:1 % %dc: Fri Aug 14 13:36:16 2015 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
101027 t99504    950101 jnz RIA: API getInstance 
101029 t99860    950101 jnz RIA: Notify order and number of parameters
110204 c28615    9501c1 jnz RIA: object isEqualTo generates exception
110314 c28748    9501c1 jnz RIA: update code to remove warning out of scope
121219 c29600    100101 ago JS Runtime: add 'activate' function to JS API occurrence object
131202 c29641    100101 ago HTMLForms/DSP: rename JS Api DSPInstance/getDSPInstance/getDSPInstances
130213 c29642    100101 ago HtmlForms/DSP: Make 'main' instance JS API object easily accessible
150519 c31365    970101  tsk Support OUT parameters and return value for JS activate and createInstance
150612           970101 ath Implement Javascript labels
date   refnum    version who description
*******************************************************************************/

/*global UNIFACE Promise _uf */


/**
 * The namespace of the UNIFACE RIA JavaScript API for accessing component instances,
 * entities, occurrences and fields on a Uniface RIA web page.
 */


///////////////////////////////////////////////////////////////////////////////
// The "uniface" object itself, holding the API functions and some constants.
///////////////////////////////////////////////////////////////////////////////
/// <reference path="ubase.js" />
/// <reference path="uprops.js" />
/// <reference path="udata.js" />
/// <reference path="uluv.js" />

(function (global, _uf_ui, _ufd, _uf_instance_manager) {
    "use strict";

    /**
     * The public `uniface` namespace
     *
     * @name uniface
     * @namespace
     */
	global.uniface = global.uniface  || {};
    var uniface = global.uniface;

    uniface.vsn = "9.7/1";

    /* Types used in the API */
    uniface.TYPE_INSTANCE    = "Instance";
    uniface.TYPE_DSPINSTANCE = uniface.TYPE_INSTANCE;
    uniface.TYPE_ENTITY      = "Entity";
    uniface.TYPE_OCCURRENCE  = "Occurrence";
    uniface.TYPE_FIELD       = "Field";
    uniface.TYPE_LABEL       = "Label";


    /**
     *  Helper function for creating Entity DataObjects.
     */
    uniface._getAPIObject = function (Constructor, data) {
        if (!data) {
            return null;
        }
        if (!data.api_o) {
            data.api_o = new Constructor(data);
        }
        return data.api_o;
    };

    /**
     * Helper function for updating properties on a field.
     *
     * @param a_field
     *      Field whose properties to update
     * @param a_props
     *      An object holding the properties to be set
     * @param a_syntax
     *      An object holding the syntax properties to be set
     */
    uniface._updateProps = function  (a_obj, a_props, a_syntax) {
        var l_ido = a_obj._getIDO();
        if (l_ido.normalizedProps) {
            l_ido.normalizedProps.merge(a_props, a_syntax || l_ido.normalizedProps.syntax);
            var l_luvObject = a_obj._getLUVObject();
            if (l_luvObject) {
                l_luvObject.setProperties();
            }
        }
    };

    /**
     * Utility function for creating a new Occurrence for this entity.
     *
     * The occurrence is created with a given *internal* index.
     * @param idx
     *      The internal index for the new occurrence.
     * @returns
     *      The uniface.Occurrence API object for the new Occurrence.
     */
    uniface._creocc = function  (ido, idx) {
        if (ido.def.hasNEDFields) {
            if (ido.def.ownsNEDFields) {
                throw new uniface.OccurrenceCreationException(this, "Entity has non-editable fields.");
            } else {
                throw new uniface.OccurrenceCreationException(this, "Entity contains an inner entity that has non-editable fields.");
            }
        }
        // Create a single new data occurrence.
        var occ = uniface._getAPIObject(uniface.Occurrence, _ufd.creOcc(_ufd.getInstance(ido), ido, ido.def, idx));
        if (occ) {
            if (ido.ro) {
                var containerOcc = ido.container;
                var containerEnt = ido.container.container;
                if(_ufd.isInstanceOcc(containerOcc)) // no container entity then refresh this 'ido'
                {
                    ido.ro.refresh(ido);
                }
                else // look-up and refresh the empty ancestors as well
                {
                    _uf.data.setOccMod(containerOcc.ro.data, "indirect");
                    containerEnt.ro.refresh(containerEnt);       
                }
            }
        }
        return occ;
    };

    /**
     * //TODOC
     * @param a_occ
     * @returns {boolean}
     */
    uniface._isOccMod = function (a_occ) {
        return _ufd.isInstanceOcc(a_occ) ? false : _ufd.isOccMod(a_occ);
    };

    /**
     * Marks this Entity's parent as modified.
     *
     * @param mod Modification status.
     * @param ent
     */
    uniface._markAsModified_ent = function (mod, ent) {
        // Mark this Entity's parent as indirectly modified,
        // but only if the Entity's parent was not marked as modified already.
        if (!uniface._isOccMod(ent.container)) {
            uniface._markAsModified_occ("indirect", ent.container);
        }
    };

    /**
     * Marks this Occurrence's IDO as modified.
     *
     * @param mod Modification status.
     * @param occ
     */
    uniface._markAsModified_occ = function (mod, occ) {
        if (!_ufd.isInstanceOcc(occ)) {
            // Mark this Occurrence's internal data object as modified.
            _ufd.setOccMod(occ, mod);
            // If this Occurrence has a parent then mark that as indirectly modified.
            uniface._markAsModified_ent("indirect", occ.container);
        }
    };

    /**
     * Returns a reference to the uniface.Instance object that represents
     * a given component instance name on the browser.
     *
     * @memberof uniface
     * @param instName
     *     Name of the component instance
     * @return
     *     A reference to the named uniface.Instance object, or
     *     <code>null</code> if there is no component instance with the
     *     given name.
     */
    uniface.getInstance = function(instName) {
        var instance;
        var dspInstance = null;
        
        // Use the main instance by default
        if (instName === undefined)
        {
            instance = _uf.vp.mainInstance;
            if (instance)
            {
                dspInstance = uniface._getAPIObject(uniface.Instance, instance);
            }
        }
        else
        {
            // Find the given component instance in the internal administration;
            if (typeof(instName) === "string") {
                instName = instName.toUpperCase();
                instance = _uf_instance_manager.getInstance(instName);
            }
        }
            
        if ( instance && (instance.definition || instance._pendingCreate) ) {
            dspInstance = uniface._getAPIObject(uniface.Instance, instance);
        }
        
        return dspInstance;
    };

    /**
     * This function is here for compatibility reasons. Check getInstance() for
     * the actual implementation.
     *
     * @memberof uniface
     */
    uniface.getDSPInstance  = function(instName) {
        if (instName === undefined)
        {
            // Old uniface.getDSPInstance function should require a parameter
            return null;
        }
        return uniface.getInstance(instName);
    };
    
    /**
     * Returns a array of component Instances that are contained in the current page
     * as they are currently available on the browser. Each of those
     *
     * @memberof uniface
     */
    uniface.getInstances = function() {
        var instanceArray = [];
        // Add the instance object of the currently available instances to the array.
        _uf_instance_manager.some(function (a_inst, a_name) {
            if ((a_inst.definition || a_inst._pendingCreate) && !a_inst._pendingDelete) {
                instanceArray.push(uniface.getInstance(a_name));
            }
        });
        return instanceArray;
    };
    
    /**
     * This function is here for compatibility reasons. Check getInstances() for
     * the actual implementation.
     *
     * @memberof uniface
     */
    uniface.getDSPInstances = function() {
        return uniface.getInstances();
    };
    
    /**
     * Returns a array of strings that are the names of the component instances
     * that are currently available on the browser. Each of those names can
     * be used as an argument to {@link uniface.getInstance}. The
     * returned array of names always contains at least one component instance
     * name (the outermost component instance).
     * The list of names is alphabetically sorted.
     *
     * @memberof uniface
     *
     * @return
     *     Alphabetically sorted array of component instance names.
     */
    uniface.getInstanceNames = function() {
        var instanceNameArray = [];
        // Add the names of the currently available component instances to the array.
        _uf_instance_manager.some(function (a_inst, a_name) {
            if ((a_inst.definition || a_inst._pendingCreate) && !a_inst._pendingDelete) {
                instanceNameArray.push(a_inst.instanceName);
            }
        });
        // Sort by name, to make the order defined.
        instanceNameArray.sort();
        return instanceNameArray;
    };
    
    /**
     * This function is here for compatibility reasons. Check getInstanceNames() for
     * the actual implementation.
     *
     * @memberof uniface
     */
    uniface.getDSPInstanceNames = function() {
        return uniface.getInstanceNames();
    };
    
    /**
     * Activate creates a component instance of the given Instance name, invoking the operation. Returning a promise that is fulfilled with the instance as its value.
     * 
     * This method will load the component definition if not already
     * available (requires a round-trip).
     *
     * @memberof uniface
     * 
     * @return
     *     Returning a promise that is fulfilled with the instance as its value.
     */
    uniface.createInstance = function (componentName, instanceName, operationName) {
        var l_promise;
        componentName = componentName.toUpperCase();
        if (!instanceName) {
            instanceName = componentName;
        } else {
            instanceName = instanceName.toUpperCase();
        }

        var inst = _uf_instance_manager.makeInstance(instanceName, componentName);
        if (inst.isActivatable()) {
            var instRef = uniface.getInstance(instanceName);
            throw new uniface.DuplicateDSPInstanceNameException(instRef);
        }
        var lParamSet = {};
        //if ( !inst.isLoaded ) {  // Check if it is loaded
        if (!inst.definition && !inst._pendingCreate) {  // Check if it is loaded
            lParamSet = { "u:dspmode": "embed" };
            if (operationName == null) { // pragma(allow-loose-compare)
                operationName = "exec";
            }
            //UNIFACE.dl.postOperation(inst, operationName, lParamSet);
            var l_args = [inst, operationName.toLowerCase(), lParamSet];
            if (arguments.length > 3) {
                // Note: this relies on this.args being an Array!
                l_args = l_args.concat(Array.prototype.slice.call(arguments, 3));
            }
            l_promise =  UNIFACE.dl.postOperation.apply(UNIFACE.dl, l_args);
        }
        else {
            l_promise = Promise.resolve({});
        }

        return l_promise.then(
            // @c31365 Retain out parameters and return value, add instance name.
            function (a) {
                if (inst._pendingCreate)
                {
                    throw new uniface.NotCreated();
                }
                a.instance = uniface.getInstance(instanceName);

                return a;
            }
        )['catch'](
            function (e) {
                inst._pendingCreate = false;
                inst.remove();
                throw(e);
            }
        );
    };

    /**
     * Activate creates a component instance of the given Instance name, invoking the operation. Returning the instance itself.
     * 
     * This method will load the component definition if not already
     * available (requires a round-trip).
     * 
     * There is no error thrown by this method as the definition of the component instance
     * will only be available and returned after a round trip.
     * NOTE: The user needs to handle the error situations of non-existing components.
     *
     * @memberof uniface
     * 
     * @return
     *     The created component instance.
     */
    uniface.createDSPInstance = function (componentName, instanceName, operationName) {
       uniface.createInstance.apply(this, arguments);
       return uniface.getInstance(instanceName ? instanceName: componentName);
    };

    // Make a specific set of uniface.Instance functions available
    // as functions on the 'uniface' object, as a shortcut for
    // applying them on the main Instance.
    // The list contains objects with a 'name' property, denoting the name
    // of the uniface.Instance method that should be made available this way.
    // The objects optionally also contain a 'globName' property, denoting
    // the name of the method as it should be known in the 'uniface'
    // object.  The 'globName' property is not needed if the two names are
    // the same.
    var i, nameList = ["activate","getComponentName", "getEntity","getEntities"];
    for (i = 0; i < nameList.length; i++) {
        (function(){
            var name = nameList[i];
            uniface[name] = function() {
                var mainInst = uniface.getInstance();
                return mainInst[name].apply(mainInst, arguments);
            };
        })();
    }

})(this, this._uf.ui, this._uf.data, this._uf.InstanceManager);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/

/*global UNIFACE uniface Promise _uf */

;(function (global, _uf_ui, _ufd) {

    'use strict';

    ///////////////////////////////////////////////////////////////////////////////
    // uniface.DataObject: the common part of the Data Addressing API objects.
    ///////////////////////////////////////////////////////////////////////////////

    var _updateProps = uniface._updateProps;
    var _getAPIObject = uniface._getAPIObject;


    /**
     * The common part of all objects that the Uniface RIA JavaScript API can
     * return.
     *
     * @constructor
     *
     * @param ido
     *     Internal Data Object associated with this DataObject.
     * @param def
     *     Meta data associated with the ido.
     * @param id
     *     Internal ID for this DataObject.
     * @param parent
     *     Parent DataObject to which the DataObject belongs.
     *     May be NULL if this is a top-level DataObject.
     */
    uniface.DataObject = function (ido) {
        /** This DataObject's internal data object (IDO). */
        this._ido = ido;
    };

    uniface.DataObject.prototype = {
        getEvents: function () {
            var lo = this._getLUVObject();
            if (lo) {
                return lo.events || {};
            }
        },

        _def: function () {
            return this._getIDO().def;
        },
        /**
         * Gets this Field's properties.
         * @returns
         *      This Field's properties
         */
        getProperties: function () {
            var l_normProps = this._getIDO().normalizedProps;
            if (l_normProps) {
                return l_normProps.getRawProps();
            }
            return {};
        },

        /**
         * Sets properties of this Field.
         * The given object may specify properties that this Field
         * already has -- in which case the Field's property value
         * is overwritten with the new value -- or properties that
         * the Field does not yet have -- in which case the Field
         * gets that additional property.
         * @param a_props
         *      An object with property name-value pairs.
         *      For example:
         * @example
         *      { "style:color":"red", "html:class":"standard" }
         */
        setProperties: function (a_props) {
            _updateProps(this, a_props);
        },
        /**
         * Sets a property of this object to a given value.
         * @param a_prop
         *      Name of the property whose value to set.
         * @param a_val
         *      New value of the property.
         */
        setProperty: function (a_prop, a_val) {
            var l_o = {};
            l_o[a_prop] = a_val;

            this.setProperties(l_o);
        },
        _isValid: function () {
            return this._ido && !this._ido.isInvalid;
        },

        /**
         * Gets the value of a property of this Field.
         * @param a_prop
         *      Name of the property whose value to get
         * @returns
         *      The property of the named value, or
         *      'undefined' if this Field does not have such a property
         */
        getProperty: function (a_prop) {
            if (this._getIDO().normalizedProps) {
                return this._getIDO().normalizedProps.get(a_prop);
            }
        },

        /**
         * Removes a property from this Field.  The result is that
         * this Field will no longer have the property.
         * @param a_prop
         *      Name of the property to be cleared.
         */
        clearProperty: function (a_prop) {
            var l_o = {};
            l_o["!" + a_prop] = "";
            _updateProps(this, l_o);
        },

        /**
         * Clears all properties of this Field.
         * A common use of this function would be like this:
         *     fld.clearProperties();
         *     fld.setProperties(newPropertySet);
         * to replace this Field's current set of properties by
         * the supplied new set of properties.
         */
        clearProperties: function () {
            _updateProps(this, {"!": ""});
        },

        /**
         * Gets the Internal Data Object for this DataObject.
         * @return
         *     This DataObject's Internal Data Object
         * @throw InvalidDataObjectException
         *     If this DataObject's Internal Data Object is not valid
         */
        _getIDO: function () {
            if (!this._isValid()) {
                throw new uniface.InvalidDataObjectException(this);
            }
            return this._ido;
        },

        /**
         * Gets this DataObject's name.
         * @return
         *     This DataObject's name.
         */
        getName: function () {
            return this._ido.def.nm;
        },

        /**
         * Gets the unqualified name of this DataObject.
         * @return
         *     This DataObject's unqualified name.
         */
        getShortName: function () {
            var name = this.getName();
            var i = name.indexOf(".");
            if (i >= 0) {
                name = name.substring(0, i);
            }
            return name;
        },

        /**
         * Gets the type of this DataObject, expressed as a string.
         * @return
         *     The type of this DataObject.
         */
        getType: function () {
            return this._type;
        },

        /**
         * Tells whether this DataObject equals another DataObject.
         * Two DataObjects are considered equal if they represent
         * the same object.
         * @param otherDataObject
         *     The DataObject with which to compare this DataObject.
         * @return true if and only if this DataObject equals the other one,
         *         all other cases return false.
         * @throw InvalidDataObjectException
         *     If this DataObject's Internal Data Object is not valid
         */
        isEqualTo: function (otherDataObject) {
            var ido = this._getIDO();
            var otherIDO;
            if (otherDataObject) {
                try {
                    otherIDO = otherDataObject._getIDO();
                } catch (e) {
                    otherIDO = undefined;
                }
            }
            return ido === otherIDO;
        },

        /**
         * Gets the uniface.Instance object that represents the
         * Instance of which this DataObject is a part.
         * @return
         *     The Instance that this DataObject is a part of
         * @throw InvalidDataObjectException
         *     If this DataObject's Internal Data Object is not valid
         */
        getInstance: function () {
            var dobj = _ufd.getInstance(this._getIDO());
            return dobj ? _getAPIObject(uniface.Instance, dobj) : null;
        },

        /**
         * Gets the LUV object for this DataObject.
         * The LUV object is an object that is closely associated with one
         * or more elements in the web page's DOM tree.
         * @returns
         *      This DataObject's LUV object, or null if it has no LUV object.
         */
        _getLUVObject: function () {
            var ido = this._getIDO();   // Validate!
            return ido.ro || null;
        },

        /**
         * Gets a string representation for this DataObject.
         * @return
         *     This DataObject as a string.
         */
        toString: function () {
            var string = this.getType() + " " + this.getName();
            if (!this._isValid()) {
                string = string + " (invalid)";
            }
            return string;
        }
    };

    uniface.DataObject.prototype.getDSPInstance = uniface.DataObject.prototype.getInstance;

})(this, this._uf.ui, this._uf.data);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/

/*global UNIFACE uniface Promise _uf */

;(function (global, _uf_ui, _ufd) {

    'use strict';

    ///////////////////////////////////////////////////////////////////////////////
    // uniface.Instance: the class representing a component instance.
    ///////////////////////////////////////////////////////////////////////////////

    var _getAPIObject = uniface._getAPIObject;

    /**
     * The class representing a component instance on a Uniface RIA web page.
     *
     * @constructor
     * @extends uniface.DataObject
     *
     * @param instance
     *     The internal data object for the component instance
     */
    uniface.Instance = function(instance) {
        uniface.DataObject.call(this, instance);
    };

    uniface.DSPInstance = uniface.Instance;

    uniface.Instance.prototype = new uniface.DataObject();

    uniface.Instance.prototype._isValid = function() {
        return ( this._ido && !this._ido.isInvalid && this._ido.definition );
    };

    /** String denoting the type of this class. */
    uniface.Instance.prototype._type = uniface.TYPE_INSTANCE;

    uniface.Instance.prototype._isActivatable = function() {
        return (this._ido && this._ido.isActivatable());
    };

    uniface.Instance.prototype._hasOperation = function(anOperationName) {
        return this._isValid() && this._ido && this._ido.definition &&
            this._ido.definition.operations && this._ido.definition.operations[anOperationName];
    };

    uniface.Instance.prototype._isOccMod = function() {
        return false;
    };

    /**
     * Gets the uniface.DataObject that is the parent DataObject
     * of this DataObject.
     * @return
     *     This DataObject's parent DataObject.
     * @throw InvalidDataObjectException
     *     If this DataObject's Internal Data Object is not valid
     */
    uniface.Instance.prototype.getParent = function() {
        this._getIDO(); // Validate!
        return null;
    };

    uniface.Instance.prototype.activate = function(anOperationName) {
		var me = this;
        if (!this._isActivatable() && !(this._ido && this._ido._pendingDetach && anOperationName === "detach")) {
           throw new uniface.InvalidDSPInstanceException(this);
        }

        this._ido._pendingDetach = false;
        var l_args = [this._ido, anOperationName.toLowerCase(), {_syncMode: true}];
        if (arguments.length > 1) {
            // Note: this relies on this.args being an Array!
            l_args = l_args.concat(Array.prototype.slice.call(arguments, 1));
        }
        /* @c31365 resolve with out parameters and instance, to keep this interface identical to uniface.createInstance */
        return UNIFACE.dl.postOperation.apply(UNIFACE.dl, l_args).then(
            function(a)
            {
                a.instance = me;
                return a;
            }
        );
    };

    /**
     * Remove the instance.
     */
    uniface.Instance.prototype.remove = function () {
        // The deletion itself is implemented as an 'Async' operation since it has a scope,
        // e.g. we cannot delete if we're still awaiting a request or a response.
        var l_inst = this._ido;

        function l_doDelete() { // this==LUV instance
            // if this is attached to a parentNode, detach it;
            if (l_inst.widget != null) {// pragma(allow-loose-compare)
                l_inst.widget.setValue("");
            }

            // if ( this has children attached, detach the children
            if (l_inst.children) {
                var childName;
                for (childName in l_inst.children) if (l_inst.children.hasOwnProperty(childName)) {
                    l_inst.children[childName].widget.setValue("");
                }
            }
            function l_cleanup() {
                l_inst.remove();
            }
            l_inst.addOperation("_i_cleanup", l_cleanup);
            return UNIFACE.dl.postOperation(l_inst, "_i_cleanup", { scope: { requesttype: "clientside" } });
        }

        if ( !this._isActivatable() ) {
            throw new uniface.InvalidDSPInstanceException(this);
        }


        l_inst._pendingDelete = true;
        l_inst._pendingDetach = true;


        l_inst.addOperation("_i_delete", l_doDelete);
        return UNIFACE.dl.postOperation(l_inst, "_i_delete", { scope: { requesttype: "clientside" } });/*.
            then(
                function () {

                })['catch'](
                function (e) {
                    l_inst.remove();
                });*/
    };

    /**
     * Gets this component instance's name.
     * @return
     *     This component instance's name.
     */
    // Note: this overrides the getName of the prototype;
    // the prototype's getName implementation returns the
    // name of the component.
    uniface.Instance.prototype.getName = function() {
        return this._ido.instanceName;
    };

    /**
     * Gets the component name for this component instance.
     * @return
     *     The component name for this component instance.
     * @throw InvalidDataObjectException
     *     If this component instance's Internal Data Object is not valid
     */
    uniface.Instance.prototype.getComponentName = function() {
        if (!this._isValid()) {
           throw new uniface.InvalidDSPInstanceException(this);
        }
        return this._getIDO().componentName;
    };

    /**
     * Gets an array of uniface.Entity elements that exist at the
     * top-level of this component instance.
     * @return
     *     Array of uniface.Entity objects, alphabetically sorted by entity name.
     * @throw InvalidDataObjectException
     *     If this component instance's Internal Data Object is not valid
     */
    uniface.Instance.prototype.getEntities = function() {
        if (!this._isValid()) {
           throw new uniface.InvalidDSPInstanceException(this);
        }
        var ido = this._getIDO(),
         entities = [],      // The resulting array of uniface.Entity objects.
         id,
         dataElem;
        // Loop through the elements of this component instance's data
        // and create an uniface.Entity object for each entity encountered.
        for (id in ido.definition) if (ido.definition.hasOwnProperty(id)) {
            dataElem = _ufd.getOccChild(ido.data,id);
            if ( ido.definition[id].type === "entity" && dataElem ) {
                // Found an entity.  Add a new uniface.Entity object to the array.
                entities.push(_getAPIObject(uniface.Entity, dataElem));
            }
        }
        entities.sort(function(a,b) { return a.getName() > b.getName() ? 1 : -1; } );
        return entities;
    };

    /**
     * Gets the uniface.Entity object given the name of the entity.
     * @param
     *     The name of the required entity.
     * @return
     *     A uniface.Entity object,
     *     or <code>null</code> if this component instance does not have an entity
     *     with the given name at its outermost level.
     * @throw InvalidDataObjectException
     *     If this component instance's Internal Data Object is not valid
     */
    uniface.Instance.prototype.getEntity = function(entityName) {
        if (!this._isValid()) {
           throw new uniface.InvalidDSPInstanceException(this);
        }
        var ido = this._getIDO();
        if (typeof(entityName) === "string") {
            var id;
            var defElem;
            // Loop through the elements in this component instance's definition
            // in search for an entity definition with the specified name.
            entityName = entityName.toUpperCase();
            for (id in ido.definition) if (ido.definition.hasOwnProperty(id)) {
                defElem = ido.definition[id];
                if (defElem.nm === entityName) {
                    return _getAPIObject(uniface.Entity, _ufd.getOccChild(ido.data,id));
                }
            }
        }
        // Specified entity not found.
        return null;
    };

    /**
     * Gets this component instance's LUV object.
     * @return
     *      This component instance's LUV object.
     */
    uniface.Instance.prototype._getLUVObject = function() {
        if (!this._isValid()) {
           throw new uniface.InvalidDSPInstanceException(this);
        }
        return this._getIDO().occs[0];  // The single-outermost occurrence.
    };

    /**
     * Gets this component instance's LUV object.
     * @return
     *      This component instance's LUV object.
     */
    uniface.Instance.prototype.render = function(a_element) {
        this._getIDO().setLayout(this._getIDO().layout, a_element);
    };

})(this, this._uf.ui, this._uf.data);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/

/*global UNIFACE uniface Promise _uf */

;(function (global, _uf_ui, _ufd) {

    'use strict';

    ///////////////////////////////////////////////////////////////////////////////
    // uniface.Entity: the class representing entities.
    ///////////////////////////////////////////////////////////////////////////////

    var _getAPIObject = uniface._getAPIObject;
    var _creocc = uniface._creocc;

    /**
     * The class representing the data of an entity in a component instance.
     *
     * @constructor
     * @extends uniface.DataObject
     *
     * @param entData
     *     The internal data object for the entity
     * @param entDef
     *     The internal definition of the entity
     * @param id
     *     Internal ID of the entity.
     * @param parent
     *     Parent DataObject to which the entity belongs.
     */
    uniface.Entity = function(entData/*, entDef, id, parent*/) {
        uniface.DataObject.call(this, entData);
    };

    uniface.Entity.prototype = new uniface.DataObject();

    /** String denoting the type of this class. */
    uniface.Entity.prototype._type = uniface.TYPE_ENTITY;

    uniface.Entity.prototype.getParent = function() {
        var l_ido = this._getIDO(); // Validate!
        if (!_ufd.isInstanceOcc(l_ido.container)) // Check: does the occurrence's parent have a parent ? if not: it's the 'occurrence' that represents the container of outer entities which is e.g. the same as the instance
        {
            return _getAPIObject(uniface.Occurrence, l_ido.container);
        }
        else
        {
            return _getAPIObject(uniface.Instance, _ufd.getInstance(l_ido));
        }
    };
    /**
     * Gets the number of occurrences this Entity has.
     * @return
     *     Number of occurrences in this entity.
     * @throw InvalidDataObjectException
     *     If this Entity's Internal Data Object is not valid
     */
    uniface.Entity.prototype.getOccurrenceCount = function() {
        var ido = this._getIDO();
        var idoOccCount = _ufd.getOccCnt(ido);
        var count = 0;
        var i = 0;
        // Count the occurrences that don't have the "del" status.
        while (i < idoOccCount) {
            if (_ufd.getOccStatus(_ufd.getOcc(ido, i++)) !== "del") {
                count++;
            }
        }
        return count;
    };

    /**
     * Gets this Entity's n-th occurrence.
     * @param seqNr
     *     The requested occurrence number.
     *     Occurrence numbering starts with zero (as is customary in Javascript).
     * @return
     *     The occurrence of this Entity that has sequence number 'seqNr',
     *     or NULL if this Entity has no such occurrence.
     * @throw InvalidDataObjectException
     *     If this Entity's Internal Data Object is not valid
     */
    uniface.Entity.prototype.getOccurrence = function(seqNr) {
        var ido = this._getIDO();
        var occ = null;
        seqNr = parseInt(seqNr, 10);
        if (!isNaN(seqNr) && seqNr >= 0) {
            var i = 0;
            var idoOccCount = _ufd.getOccCnt(ido);
            // Skip the deleted occurrences that are at the front of the list.
            while (i < idoOccCount && _ufd.getOccStatus(_ufd.getOcc(ido, i)) === "del") {
                i++;
            }
            // Count non-deleted occurrences until we reach
            // either the wanted occurrence or the end of the list.
            while (i < idoOccCount && seqNr > 0) {
                i++;
                seqNr--;
                while (i < idoOccCount && _ufd.getOccStatus(_ufd.getOcc(ido, i)) === "del") {
                    i++;
                }
            }
            if (i < idoOccCount) {
                occ = _getAPIObject(uniface.Occurrence, _ufd.getOcc(ido, i));
            }
        }
        return occ;
    };

    /**
     * Gets the current occurrence of this Entity.
     * @return
     *      The current occurrence of this Entity, or <code>null</code>
     *      if this Entity has no knowledge about currency.
     */
    uniface.Entity.prototype.getCurrentOccurrence = function() {
        return _getAPIObject(uniface.Occurrence, _ufd.getCurOcc(this._getIDO()));
    };

    /**
     * Gets an array holding this Entity's occurrences,
     * ordered as determined by the latest received response
     * from the server.
     * @returns
     *     An array of uniface.Occurrence objects.
     */
    uniface.Entity.prototype.getOccurrences = function() {
        var ido = this._getIDO();
        var idoOccCount = _ufd.getOccCnt(ido);
        var idoOcc;
        var occs = [];
        var i = 0;
        while (i < idoOccCount) {
            idoOcc = _ufd.getOcc(ido, i++);
            // Only use the non-deleted occurrences.
            if (_ufd.getOccStatus(idoOcc) !== "del") {
                occs.push(_getAPIObject(uniface.Occurrence, idoOcc));
            }
        }
        return occs;
    };

    /**
     * Creates a new Occurrence for this Entity.
     * The new Occurrence is inserted between this Entity's Occurrences
     * such that the new Occurrence's index is the supplied index.
     * If the supplied index is negative then this function acts as if the
     * index were this Entity's Occurrence count.
     * If the supplied index is greater than this Entity's Occurrence count
     * then no new Occurrence is created.
     * @param index
     *      The index the new Occurrence should have
     * @returns
     *      The new occurrence, or NULL if no Occurrence was created.
     * @throws OccurrenceCreationException
     *      If this Entity has non-editable fields.
     */
    uniface.Entity.prototype.createOccurrence = function(index) {
        var ido = this._getIDO();
        // Find the insertion point in the data.
        var i;
        var idoOccCount = _ufd.getOccCnt(ido);
        if (index < 0) {
            i = idoOccCount;
        } else {
            i = 0;
            while (i < idoOccCount  && index > 0) {
                while (i < idoOccCount && _ufd.getOccStatus(_ufd.getOcc(ido, i)) === "del") {
                    i++;
                }
                i++;
                index--;
            }
            if (index > 0) {
                // Apparently there are less undeleted occurrences than "index".
                return null;
            }
        }
        return _creocc(ido, i);
    };

    /**
     * Clears all the occurrences from this Entity, leaving
     * the entity with only the default empty Occurrence.
     */
    uniface.Entity.prototype.clear = function() {
        _ufd.clearEnt(this._getIDO());
        var luvEnt = this._getLUVObject();
        if (luvEnt) {
            luvEnt.refresh(this._getIDO());
        }
    };

})(this, this._uf.ui, this._uf.data);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/

/*global UNIFACE uniface Promise _uf */

;(function (global, _uf_ui, _ufd) {

    'use strict';

    ///////////////////////////////////////////////////////////////////////////////
    // uniface.Occurrence: the class representing occurrences.
    ///////////////////////////////////////////////////////////////////////////////

    var _getAPIObject = uniface._getAPIObject;
    var _creocc = uniface._creocc;

    /**
     * The class representing the data of an occurrence in a component instance.
     *
     * @constructor
     * @extends uniface.DataObject
     *
     * @param occData The internal data object for the occurrence
     * //@param ent The parent uniface.Entity object to which the occurrence belongs
     */
    uniface.Occurrence = function(occData) {
        uniface.DataObject.call(this, occData);
    };



    uniface.Occurrence.prototype = new uniface.DataObject();

    uniface.Occurrence.prototype._isValid = function() {
        return this._ido && _ufd.isOccValid(this._ido);
    };

    uniface.Occurrence.prototype._def = function () {
        return this._getIDO().container.def;
    };
    uniface.Occurrence.prototype.getName = function () {
        return this._ido.container.def.nm;
    };

    uniface.Occurrence.prototype._isOccMod = function() {
        return _ufd.isOccMod(this._getIDO());
    };

    /** String denoting the type of this class. */
    uniface.Occurrence.prototype._type = uniface.TYPE_OCCURRENCE;

    /**
     * Gets the Internal Data Object for this Occurrence.
     * @return
     *     This Occurrences's Internal Data Object
     * @throw InvalidDataObjectException
     *     If this Occurrences's Internal Data Object is not valid
     *     or has status "del".
     */
    uniface.Occurrence.prototype._getIDO = function() {
        if (!this._isValid() || _ufd.getOccStatus(this._ido) === "del") {
            throw new uniface.InvalidDataObjectException(this);
        }
        return this._ido;
    };

    uniface.Occurrence.prototype.getParent = function() {
        return _getAPIObject(uniface.Entity, this._getIDO().container );
    };
    /**
     * Determines the index that this occurrence would currently have
     * in the array of occurrences that would be returned by calling
     * getOccurrences() on the containing Entity.
     * Note that the occurrence number may change as the result of responses
     * to server requests.
     *
     * The average execution time of this function is linear with respect to
     * the total number of occurrences of the containing Entity.
     * @return
     *     This Occurrence's index.
     * @throw InvalidDataObjectException
     *     If this Occurrence's Internal Data Object is not valid
     */
    uniface.Occurrence.prototype.getIndex = function() {
        var ido = this._getIDO();
        var idoEnt = ido.container;
        var idoOccCount = _ufd.getOccCnt(idoEnt);
        var count = 0;
        var i;
        for (i = 0; i < idoOccCount; i++) {
            if (ido === _ufd.getOcc(idoEnt, i)) {
                return count;
            }
            // Count only the non-deleted occurrences.
            if (_ufd.getOccStatus(_ufd.getOcc(idoEnt, i)) !== "del") {
                count++;
            }
        }
        return null;
    };

    /**
     * Utility function that determines the index that this Occurrence's
     * IDO has in the array of occurrences of its Entity's IDO.
     * @return
     *      The internal index
     */
    uniface.Occurrence.prototype._getInternalIndex = function() {
        var ido = this._getIDO();
        var entityIDO = ido.container;
        // Find this Occurrence's IDO in the list of its Entity's internal occurrences.
        var i = 0;
        while (_ufd.getOcc(entityIDO, i) !== ido) {
            i++;
        }
        return i;
    };


    uniface.Occurrence.STATUS_EMPTY = "empty";
    uniface.Occurrence.STATUS_NEW = "new";
    uniface.Occurrence.STATUS_UNMODIFIED = "est";
    uniface.Occurrence.STATUS_MODIFIED = "mod";

    /**
     * Gets the status of this occurrence.
     * @returns One of
     *         uniface.Occurrence.STATUS_EMPTY
     *         uniface.Occurrence.STATUS_NEW
     *         uniface.Occurrence.STATUS_UNMODIFIED
     *         uniface.Occurrence.STATUS_MODIFIED
     * @throw InvalidDataObjectException If this Occurrences's Internal
     *      Data Object is not valid
     */
    uniface.Occurrence.prototype.getStatus = function() {
        return _ufd.getOccStatus(this._getIDO());
    };

    /**
     * Creates a DataObject for this Occurrence.
     * @param childType The type of DataObject that should be created.
     * @param childName The name of the DataObject that should be created.
     * @param childConstructor The function that performs the actual creation.
     * @return The created child-DataObject,
     *      or NULL if this occurrence has no child with the specified
     *      type and name.
     * @throw InvalidDataObjectException If this Occurrences's Internal
     *      Data Object is not valid
     */
    uniface.Occurrence.prototype._createChild = function(childType, childName, childConstructor) {
        var ido = this._getIDO();
        if (typeof childName === "string") {
            if (childName.indexOf(".") < 0) {
                childName = childName + "." + this._def().nm;
            }
            childName = childName.toUpperCase();
            var defElems = this._def().occs;
            var id;
            var defElem;
            for (id in defElems) if (defElems.hasOwnProperty(id)) {
                defElem = defElems[id];
                if (defElem.type === childType && defElem.nm === childName) {
                    return _getAPIObject(childConstructor, _ufd.getOccChild(ido, id));
                }
            }
        }
        return null;
    };

    /**
     * Creates an array of child-DataObjects for this Occurrence.
     * This function is for internal use only.
     * @param childType The type of DataObjects that should be created.
     * @param a_constructor The function that performs the actual creation.
     * @return An array holding the requested DataObjects.
     * @throw InvalidDataObjectException If this Occurrences's Internal Data Object is not valid
     */
    uniface.Occurrence.prototype._createChildren = function(childType, a_constructor) {
        var ido = this._getIDO();
        var children = [];
        var defElems = this._def().occs;
        var id;
        var defElem;
        for (id in defElems) if (defElems.hasOwnProperty(id)) {
            defElem = defElems[id];
            if (defElem.type === childType && _ufd.getOccChild(ido, id) !== undefined) {
                children.push(_getAPIObject(a_constructor, _ufd.getOccChild(ido, id)));
            }
        }
        children.sort(function(a,b) { return a.getName() > b.getName() ? 1 : -1; } );
        return children;
    };

    /**
     * Creates a new occurrence and inserts it right before this one
     * in the list of the Entity's occurrences.
     * @returns The newly created occurrence
     * @throws OccurrenceCreationException If this Occurrence's entity has
     *      non-editable fields.
     */
    uniface.Occurrence.prototype.insertNewBefore = function () {
        _creocc(this._getIDO().container, this._getInternalIndex());
    };

    /**
     * Creates a new occurrence and inserts it right after this one
     * in the list of the Entity's occurrences.
     * @returns The newly created occurrence
     * @throws OccurrenceCreationException If this Occurrence's entity has
     *      non-editable fields.
     */
    uniface.Occurrence.prototype.insertNewAfter = function() {
        _creocc(this._getIDO().container, this._getInternalIndex() + 1);
    };

    /**
     * Discards this Occurrence.
     * After this function is called this Occurrence is no longer valid;
     * many of its functions will throw an InvalidDataObjectException.
     */
    uniface.Occurrence.prototype.discard = function() {
        var l_ido = this._getIDO();
        _ufd.discardOcc(_ufd.getInstance(l_ido), l_ido.container.def, l_ido.container, l_ido);
        if (l_ido.container && l_ido.container.ro) {
            l_ido.container.ro.refresh(l_ido.container);
        }
    };

    /**
     * Deletes this Occurrence.
     * After this function is called this Occurrence is no longer valid;
     * many of its functions will throw an InvalidDataObjectException.
     * @param recurse If this parameter is supplied (and evaluates to true) then
     *      recursively all occurrences of child entities will also be removed.
     */
    uniface.Occurrence.prototype.remove = function(recurse) {
        var l_ido = this._getIDO();
        _ufd.remOcc(_ufd.getInstance(l_ido), l_ido.container.def, l_ido.container, l_ido, recurse);
        if (l_ido.container && l_ido.container.ro) {
            l_ido.container.ro.refresh(l_ido.container);
        }
    };

    /**
     * Get the named entity in this occurrence.
     * @param entityName The qualified name of the required entity.
     * @return The named entity, or NULL if there is no such entity.
     */
    uniface.Occurrence.prototype.getEntity = function(entityName) {
        return this._createChild("entity", entityName, uniface.Entity);
    };

    /**
     * Get the named field in this occurrence.
     * @param fieldName The qualified name of the required field.
     * @return The named field, or NULL if there is no such field.
     */
    uniface.Occurrence.prototype.getField = function(fieldName) {
        return this._createChild("field", fieldName, uniface.Field);
    };

    /**
     * Gets an array of uniface.Entity objects for all entities in this occurrence.
     * @return An array holding all of this occurrence's entities.
     */
    uniface.Occurrence.prototype.getEntities = function() {
        return this._createChildren("entity", uniface.Entity);
    };

    /**
     * Gets an array of uniface.Field objects for all fields in this occurrence.
     * @return An array holding all of this occurrence's fields.
     */
    uniface.Occurrence.prototype.getFields = function() {
        return this._createChildren("field", uniface.Field);
    };

    /**
     * Tells whether or not this occurrence is the current one
     * among its siblings.
     * @returns <code>true</code> if and only if this occurrence
     *      is the current one.
     */
    uniface.Occurrence.prototype.isCurrent = function() {
        var ido = this._getIDO();
        return _ufd.isOccCurrent(ido);
    };

    /**
     * Tells whether or not this occurrence is selected.
     * @returns <code>true</code> if and only if this occurrence
     *      is selected.
     */
    uniface.Occurrence.prototype.isSelected = function() {
        var ido = this._getIDO();
        return _ufd.isOccSelected(ido);
    };

    /**
     * Gets a string representation for this Occurrence.
     * Please be aware that the occurrence sequence number is part of
     * the string representation.  As the occurrence number is determined
     * using function getIndex, the use of toString may have
     * some impact on performance.
     * @return
     *     This DataObject as a string.
     */
    uniface.Occurrence.prototype.toString = function() {
        var string = this.getType() + " " + this.getName();
        if (this._isValid()) {
            string = string + ":" + this.getIndex();
        } else {
            string = string + " (invalid)";
        }
        return string;
    };
	
	 /**
     * Get a label object associated with this Occurrence.
     * @param fieldName (the name of the field who's label we require)
     * @returns {uniface.Label} (the label object)
     *
     */
    uniface.Occurrence.prototype.getLabel = function(fieldName) {
        var objLabel = null;
        var objField = this.getField(fieldName);

        if (objField !== null) {
            objLabel = objField.getLabel();
        }
        
        return objLabel;
    };

})(this, this._uf.ui, this._uf.data);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/

/*global UNIFACE uniface Promise _uf */

;(function (global, _uf_ui, _ufd) {

    'use strict';

    ///////////////////////////////////////////////////////////////////////////////
    // uniface.Field: the class representing fields.
    ///////////////////////////////////////////////////////////////////////////////

    var _updateProps = uniface._updateProps;
    var _getAPIObject = uniface._getAPIObject;

    /**
     * The class representing the data of a field in a component instance.
     *
     * @constructor
     * @extends uniface.DataObject
     *
     * @param fldData The internal data object for the field
     * //@param fldDef The internal definition of the field
     * //@param id Internal ID for the field.
     * //@param parent Parent DataObject to which the field belongs.
     */
    uniface.Field = function(fldData/*, fldDef, id, parent*/) {
        uniface.DataObject.call(this, fldData);
		this._label = null;
    };

    uniface.Field.prototype = new uniface.DataObject();


    uniface.Field.prototype.getParent = function () {
        return _getAPIObject(uniface.Occurrence, this._getIDO().container);
    };

    /** String denoting the type of this class. */
    uniface.Field.prototype._type = uniface.TYPE_FIELD;

    /**
     * Gets this Field's value.
     * @returns This Field's value.
     */
    uniface.Field.prototype.getValue = function() {
        return _ufd.getFldValue(this._getIDO());
    };

    /**
     * Marks this Field and its parent(s) as modified.
     * @param mod Modification status.
     */
    uniface.Field.prototype._markAsModified = function (mod) {
        // Mark this field's internal data object as modified.
        _ufd.setFldMod(this._getIDO(), mod);
        // Mark this field's parent as directly modified
        uniface._markAsModified_occ(mod, this._getIDO().container);
    };
    /**
     * Sets this Field's value.
     * @param a_val The new value for this Field. Should be of type string;
     *      if not, it will be converted using its toString().
     */
    uniface.Field.prototype.setValue = function(a_val) {
        var ido = this._getIDO();
        // The value should be of type string.
        // Convert it if it isn't.
        if (typeof(a_val) != "string") {
            a_val = a_val.toString();
        }
        // Set the value of the data object and its widget (if it has one).
        // Events that result from this should be disregarded;
        // that is, they should not result in firing of triggers.
        var thisField = this;
        _uf.commands.executeWithoutEvents(function() {
            // Set the value of the internal data object.
            _ufd.setFldValue(ido, a_val);
            // If there is a LUV object then also set its value.
            var l_luvObject = thisField._getLUVObject();
            if (l_luvObject) {
                l_luvObject.setValue(a_val);
                l_luvObject.setNotModified();
            }
        });
        // Mark this Field's Occurrence as directly modified.
        this._markAsModified("direct");
    };

    /**
     * Gets this Field's valrep.
     * @returns The valrep of this Field
     */
    uniface.Field.prototype.getValrep = function() {
        var _valrep = _ufd.getFldValrep(this._getIDO());
        if ( _valrep ) {
            _valrep = UNIFACE.luv.util.normalizeValrep(_valrep);
        }
        return _valrep ? _valrep[0] : _valrep;
    };

    /**
     * Gets this Field's valrep with array-based format.
     * @returns The valrep of this Field
     */
    uniface.Field.prototype.getValrepArray = function() {
        var _valrep = _ufd.getFldValrep(this._getIDO());
        if ( _valrep ) {
            _valrep = UNIFACE.luv.util.normalizeValrep(_valrep);
            var _valrep2 = [];
            var i;
            for (i=0; i<_valrep[1].length; i++) {
                _valrep2.push([_valrep[1][i], _valrep[0][_valrep[1][i]]]);
            }
            _valrep = _valrep2;
        }
        return _valrep;
    };

    /**
     * Sets this Field's valrep.
     * @param valrep The new valrep of this Field
     */
    uniface.Field.prototype.setValrep = function(valrep) {
        var l_ido = this._getIDO();
        if (valrep) {
            if ( valrep.constructor !== Array ) {
                var _valrep = [];
                for (var val in valrep ) if ( valrep.hasOwnProperty(val) ) {
                    _valrep.push([val, valrep[val]]);
                }
                valrep = _valrep;
            }
            // A valrep object was specified.
            valrep = UNIFACE.luv.util.normalizeValrep(valrep);
            _ufd.setFldValrep(l_ido, UNIFACE.luv.util.assureValrep(valrep));
            valrep = _ufd.getFldValrep(l_ido);
        } else {
            // No valrep was specified.
            // Remove the valrep definition from the Internal Data Object,
            // and fall back to the definition's valrep.
            _ufd.setFldValrep(l_ido, undefined);
            valrep = this._def().valrep;
        }
        var l_luvObject = this._getLUVObject();
        if (l_luvObject) {
            l_luvObject.setValrep(valrep, this.getValue());
        }
    };

    /**
     * Sets this Field's valrep with array-based format.
     * @param a_valrep The new valrep of this Field
     */
    uniface.Field.prototype.setValrepArray = uniface.Field.prototype.setValrep;

    /**
     * Gets the value of a syntax property of this Field.
     * @param a_prop Name of the syntax property
     * @returns The value of the syntax property
     */
    uniface.Field.prototype.getSyntaxProperty = function(a_prop) {
        if (this._getIDO().normalizedProps) {
            return this._getIDO().normalizedProps.syntax[a_prop.toUpperCase()];
        }
    };

    /**
     * Sets the value of a syntax property of this Field.
     * @param a_prop Name of the syntax property
     * @param a_val New value of the syntax property.
     *      Note: for boolean properties, like "NED", "DIG", etc.,
     *      this value should be a proper boolean value.
     * @throws InvalidSyntaxPropertyException If a_prop is an invalid syntax
     *      property name.
     */
    uniface.Field.prototype.setSyntaxProperty = function(a_prop, a_val) {
        var l_o = {};
        l_o[a_prop] = a_val;
        this.setSyntaxProperties(l_o);
    };

    /**
     * Clears a syntax property of this Field.
     * @param a_prop Name of the syntax property to be cleared
     */
    uniface.Field.prototype.clearSyntaxProperty = function(a_prop) {
        var normalizedProps = this._getIDO().normalizedProps;
        if (normalizedProps) {
            a_prop = a_prop.toUpperCase();
            var l_syn = normalizedProps.syntax;
            if (l_syn.hasOwnProperty(a_prop)) {
                delete l_syn[a_prop];
            }
            _updateProps(this, {}, l_syn);
        }
    };

    /**
     * Gets the syntax properties of this Field.
     * @returns This Field's syntax properties
     */
    uniface.Field.prototype.getSyntaxProperties = function() {
        var normalizedProps = this._getIDO().normalizedProps;
        if (normalizedProps) {
            return normalizedProps.syntax;
        }
        return {};
    };

    /**
     * Sets several syntax properties of this Field.
     * @param a_props
     *      An object holding several syntax property-value pairs.
     * @throws InvalidSyntaxPropertyException
     *      If a_props specifies an invalid syntax property name.
     */
    uniface.Field.prototype.setSyntaxProperties = function(a_props) {
        var normalizedProps = this._getIDO().normalizedProps;
        if (normalizedProps) {
            var vProp;
            var l_syn = normalizedProps.syntax;
            if (!l_syn) {
                l_syn = {};
            }
            for (vProp in a_props) if (a_props.hasOwnProperty(vProp)) {
                if (!UNIFACE.syn.isValidProp(vProp) || vProp.toUpperCase() === "NED" || vProp.toUpperCase() === "DIM") {
                    throw new uniface.InvalidSyntaxPropertyException(vProp);
                }
                l_syn[vProp.toUpperCase()] = a_props[vProp];
            }
            _updateProps(this, {}, l_syn);
        }
    };

    /**
     * Clears all syntax properties of this Field.
     */
    uniface.Field.prototype.clearSyntaxProperties = function() {
        _updateProps(this, {}, {});
    };

	
	
    /**
     * Get the label associated with a specific field
     */
    uniface.Field.prototype.getLabel = function() {
        if (this._label === null) {
            this._label = new uniface.Label(this._getIDO());
        }
        return this._label;
    };

///////////////////////////////////////////////////////////////////////////////
// uniface.Label: the class representing field labels.
///////////////////////////////////////////////////////////////////////////////


    /**
     * The class representing the data of a field label in a component instance.
     * @param fldData
     *     The internal data object (IDO) for the field with which the label is associated.
     *     This is also used as the IDO for the label.
     *     When a uniface.Label is constructed, a property 'labelValue' is added to this IDO to store the
     *     label text value associated with a particular field. This is defaulted (here in _ufd.setLabelValue)
     *     to the value specified in fldData.def.label.value, which by default is used as that field's label text
     *     in ALL occurrences of the field. Using the uniface.Label.setText method, this default
     *     label text can be overridden for a particular field.
     */
    uniface.Label = function(fldData) {
        uniface.DataObject.call(this, fldData);
        _ufd.setLabelValue(this._getIDO(), fldData.def.label.value);
    };

    uniface.Label.prototype = new uniface.DataObject();

    uniface.Label.prototype.getParent = function () {
        return _getAPIObject(uniface.Occurrence, this._getIDO().container);
    };

    /** String denoting the type of this class. */
    uniface.Label.prototype._type = uniface.TYPE_LABEL;

    /**
     * Gets this Label's text.
     * @returns
     *      Returns the label text value associated with a field in a particular occurrence.
     */
    uniface.Label.prototype.getValue = function() {
        return this._getIDO().labelValue;
    };

    /**
     * Sets this Label's text value.
     * @param a_val
     *      The new value for the label's text.
     *      Should be of type string; if not, it will
     *      be converted using its toString().
     *
     */
    uniface.Label.prototype.setValue = function(a_val) {
        var ido = this._getIDO();
        // The value should be of type string.
        // Convert it if it isn't.
        if (typeof(a_val) != "string") {
            a_val = a_val.toString();
        }

        // Set the specific label text value for the particular field the IDO is associated with.
        _ufd.setLabelValue(ido, a_val);

        // Set the value of the widget, if a LUV reference has previously been made.
        // label_r_o is the 'realized object' (i.e. LUV object) associated with the label.
        if (ido.label_r_o) {
            ido.label_r_o.setValue(ido.labelValue);
        }
    };

	uniface.DataObject.prototype.getDSPInstance = uniface.DataObject.prototype.getInstance;

})(this, this._uf.ui, this._uf.data);

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description

*******************************************************************************/

/*global UNIFACE uniface Promise _uf */

;(function () {

    'use strict';

    /**
     * //TODOC
     *
     * @param err
     */
    function l_error (err) {
        Error.call(this, err);
        // On some browsers, calling the Error constructor doesn't set message and/or stack...
        try // Then again, on some browsers, message and stack may be read-only...
        {
            this.message = err;
            this.stack = new Error().stack;
        }
        catch (e) {
        }
    }

    function defineError (a_name, a_constr, a_proto) {
        var L_constr = a_proto || l_error;
        a_constr.prototype = new L_constr();
        a_constr.prototype.constructor = L_constr;
        if (a_name) {
            a_constr.prototype.name = a_name;
        }
    }

    defineError("uniface.Error", l_error, Error);

    /**
     * //TODOC
     *
     * @param a_procerror
     * @constructor
     */
    uniface.UnifaceError = function (a_procerror) {
        this.unifaceerror = a_procerror;
        l_error.call(this, "Uniface script error" + a_procerror ? (" " + a_procerror) : "");
    };
    defineError("uniface.UnifaceError", uniface.UnifaceError);

    /**
     * //TODOC
     *
     * @constructor
     */
    uniface.ServerError = function () {
        l_error.call("Uniface server error");
    };
    defineError("uniface.ServerError", uniface.ServerError);

    /**
     * //TODOC
     *
     * @param a_msg
     * @param a_url
     * @constructor
     */
    uniface.TransportError = function (a_msg, a_url) {
        l_error.call(this, a_msg + " at " + a_url);
    };
    defineError("uniface.TransportError", uniface.TransportError);

    /**
     * //TODOC
     *
     * @param a_statuscode
     * @param a_statustext
     * @param a_url
     * @constructor
     */
    uniface.HTTPError = function (a_statuscode, a_statustext, a_url) {
        this.statuscode = a_statuscode;
        this.statustext = a_statustext;
        uniface.TransportError.call(this, "HTTP status code " + a_statuscode + ", " + a_statustext, a_url);
    };
    defineError("uniface.HTTPError", uniface.HTTPError, uniface.TransportError);

    /**
     * //TODOC
     *
     * @constructor
     */
    uniface.NotCreated = function () {
        l_error.call("Instance not created.");
    };
    defineError("uniface.NotCreated", uniface.NotCreated);

    /**
     * //TODOC
     *
     * @param a_modulename
     * @param a_moduletype
     * @param a_objectname
     * @param a_componentname
     * @constructor
     */
    uniface.ModuleNotFound = function (a_modulename, a_moduletype, a_objectname, a_componentname) {
        this.moduleName = a_modulename;
        this.moduleType = a_moduletype;
        this.objectName = a_objectname;
        this.componentName = a_componentname;
        l_error.call("Could not find the JavaScript implementation of " + this.moduleType === 't' ? "trigger " : "operation " + this.moduleName +
        " of " + (a_objectname ? a_objectname + ", " : "") + ", component " + this.componentName + ".");
    };
    defineError("uniface.ModuleNotFound", uniface.ModuleNotFound);

    /**
     * //TODOC
     * @param a_modulename
     * @param a_moduletype
     * @param a_objectname
     * @param a_componentname
     * @constructor
     */
    uniface.NotCallable = function (a_modulename, a_moduletype, a_objectname, a_componentname) {
        this.moduleName = a_modulename;
        this.moduleType = a_moduletype;
        this.objectName = a_objectname;
        this.componentName = a_componentname;
        l_error.call(this.moduleType === 't' ? "Trigger " : "Operation " + this.moduleName +
        " of " + (a_objectname ? a_objectname + ", " : "") + "component " + this.componentName + " is not callable.");
    };
    defineError("uniface.NotCallable", uniface.NotCallable);

    /**
     * Class denoting some exception in a Data Addressing API function.
     *
     * @constructor
     */
    uniface.DataAddressingException = function (msg) {
        l_error.call(this, msg);
    };
    defineError("uniface.DataAddressingException", uniface.DataAddressingException);


///////////////////////////////////////////////////////////////////////////////
// uniface.InvalidDataObjectException: Exception class used in the Data Addressing API.
///////////////////////////////////////////////////////////////////////////////


    /**
     * Exception class denoting an invalid Data Object.
     *
     * @constructor
     */
    uniface.InvalidDataObjectException = function (dataObj) {
        uniface.DataAddressingException.call(this, (dataObj ? (dataObj.getType() + " " + dataObj.getName()) : "Object") + " is not valid.");
    };
    defineError("uniface.InvalidDataObjectException", uniface.InvalidDataObjectException, uniface.DataAddressingException);


///////////////////////////////////////////////////////////////////////////////
//uniface.InvalidSyntaxPropertyException: Exception class used in the Data Addressing API.
///////////////////////////////////////////////////////////////////////////////

    /**
     * Exception class denoting an invalid syntax property name.
     *
     * @constructor
     */
    uniface.InvalidSyntaxPropertyException = function (synPropName) {
        uniface.DataAddressingException.call(this, "\"" + synPropName + "\" is not a valid syntax property name.");
    };
    defineError("uniface.InvalidSyntaxPropertyException", uniface.InvalidSyntaxPropertyException, uniface.DataAddressingException);


///////////////////////////////////////////////////////////////////////////////
//uniface.OccurrencCreationException: Exception class used in the Data Addressing API.
///////////////////////////////////////////////////////////////////////////////


    /**
     * Exception class denoting a failure that occurred during the creation of an Occurrence.
     *
     * @constructor
     */
    uniface.OccurrenceCreationException = function (a_ent, msgReason) {
        var msg = "Could not create occurrence of " + a_ent + ";  " + msgReason;
    };
    defineError("uniface.OccurrenceCreationException", uniface.OccurrenceCreationException, uniface.DataAddressingException);


///////////////////////////////////////////////////////////////////////////////////////////
//uniface.InvalidDSPInstanceException: Exception class used in the Data Addressing API. //
///////////////////////////////////////////////////////////////////////////////////////////


    /**
     * Exception class denoting an invalid component Instance.
     *
     * @constructor
     */
    uniface.InvalidDSPInstanceException = function (dataObj) {
        uniface.DataAddressingException.call(this, (dataObj ? (dataObj.getType() + " " + dataObj.getName()) : "Object") + " is not valid.");
    };
    defineError("uniface.InvalidDSPInstanceException", uniface.InvalidDSPInstanceException, uniface.DataAddressingException);


///////////////////////////////////////////////////////////////////////////////////////////
//uniface.DuplicateDSPInstanceNameException: Exception class used in the Data Addressing API. //
///////////////////////////////////////////////////////////////////////////////////////////


    /**
     * Exception class denoting an invalid component Instance.
     *
     * @constructor
     */
    uniface.DuplicateDSPInstanceNameException = function (dataObj) {
        uniface.DataAddressingException.call(this, "An instance with " + ( dataObj ? ("the name " + dataObj.getName()) : "this name") + " already exists.");
    };
    defineError("uniface.DuplicateDSPInstanceNameExceptio   n", uniface.DuplicateDSPInstanceNameException, uniface.DataAddressingException);


})();
// %fv: validation.js-1:js:1 % %dc: Mon Aug 17 09:31:05 2015 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*******************************************************************************
date   refnum    version who description
date   refnum    version who description
*******************************************************************************/

/*global UNIFACE document _uf setImmediate*/

;(function () {



    var CSS_ERROR_LABEL_IN_ERROR= '-uflderror-in-error-';
    var CSS_ERROR_LABEL_NO_ERROR= '-uflderror-no-error-';
    var CSS_FIELD_HIGHLIGHT_ERROR= '-ufld-highlight-error-';

    // Regex to find a CSS class in a DOM node
    // (?:^|\s) = start of string or any whitespace
    // (?:$|\s) = end of string or any whitespace
   function _classRegex(clazz) {
        return new RegExp('(?:^|\\s)' + clazz + '(?:$|\\s)');
    }

    // Does the supplied node implement the CSS class?
    function _hasClass(a_node, clazz) {
        return a_node.className.match(_classRegex(clazz));
    }

    // Remove the class from the supplied node
    function _removeClass(a_node, clazz) {
        a_node.className = a_node.className.replace(_classRegex(clazz) , ' ');
    }

    // Add the class to the supplied node if it doesn't already have it
    function _addClass(a_node, clazz) {
        if (!_hasClass(a_node, clazz)){
            a_node.className += ' ' + clazz;
        }
    }

    // Empty a DHTML node of children. Used to clear text from a node in this widget.
    function _emptyNode(a_node) {
        while (a_node.childNodes.length > 0) {
            a_node.removeChild(a_node.firstChild);
        }
    }

    // Set CSS Error label styling for 'in error' or 'no error'
    function _setCSSErrorLabelClasses(a_node, isInError) {
        if (isInError) {
            _removeClass(a_node, CSS_ERROR_LABEL_NO_ERROR);
            _addClass(a_node, CSS_ERROR_LABEL_IN_ERROR);
        } else {
            _removeClass(a_node, CSS_ERROR_LABEL_IN_ERROR);
            _addClass(a_node, CSS_ERROR_LABEL_NO_ERROR);
        }
    }

    // Set CSS Field Highlighting for 'in error' or 'no error'
    function _setCSSFieldHighlighting (a_node, isInError) {
        if (isInError) {
            _addClass(a_node, CSS_FIELD_HIGHLIGHT_ERROR);
        } else {
            _removeClass(a_node, CSS_FIELD_HIGHLIGHT_ERROR);
        }
    }

    function _getElement(a_widget) {
        var element;

        if (a_widget.element) {
            element = a_widget.element;
        } else if (a_widget.control.id) {
            element = document.getElementById(a_widget.control.id);
        } else {
            element = null;
        }

        if (element === undefined) {
            element = null;
        }

        return element;
    }

    _uf.view = _uf.view || {};

    // TODO: use a label widget ?
    _uf.view.errorFeedback = {
        // Show the error
        show: function (a_field, a_message) {
            // If there is no error label function defined, then assume
            // that the field is an entity that has filtered into the error system
            if (a_field.getErrorLabel !== undefined) {
                // Error label bound in _luv.realizeErrorLabel
                // Callback set in _luv.field.createCallback
                var l_boundErrorLabel = a_field.getErrorLabel();
                if (l_boundErrorLabel) {
                    _emptyNode(l_boundErrorLabel);
                    l_boundErrorLabel.appendChild(document.createTextNode(a_message));
                    _setCSSErrorLabelClasses(l_boundErrorLabel, true);
                }

                if (a_field.widget) {
                    var element = _getElement(a_field.widget);

                    if (element !== null) {
                        if (a_message) {
                            _setCSSFieldHighlighting(element, true);
                        }
                    }
                }
            }
        },

        // Hide the error
        hide: function (a_field) {
            // If there is no error label function defined, then assume
            // that the field is an entity that has filtered into the error system
            if (a_field.getErrorLabel) {
                // Error label bound in _luv.realizeErrorLabel
                // Callback set in _luv.field.createCallback
                var l_boundErrorLabel = a_field.getErrorLabel();
                if (l_boundErrorLabel) {
                    _emptyNode(l_boundErrorLabel);
                    _setCSSErrorLabelClasses(l_boundErrorLabel, false);
                }
                if (a_field.widget) {
                    // TODO: set a class:... property on the field iso manipulating the element's CSS
                    var element = _getElement(a_field.widget);

                    if (element !== null) {

                        _setCSSFieldHighlighting(element, false);

                    }
                }
            }
        }
    };

}());
// %fv: udsp.js-28.1.3:ascii:1 % %dc: Mon Nov 24 09:47:34 2014 %

/******************************************************************************
COPYRIGHT
    (C) 2014 Uniface  B.V.  All rights reserved.

    U.S. GOVERNMENT RIGHTS-Use, duplication, or disclosure by the U.S.
    Government is subject to restrictions as set forth in applicable
    license agreement with Uniface B.V. and/or its predecessor in 
    interest and as provided in DFARS 227.7202-1(a) and 227.7202-3(a)
    (1995), DFARS 252.227-7013(c)(1)(ii)(OCT 1988), FAR 12.212(a)(1995),
    FAR 52.227-19, or FAR 52.227-14(ALT III), as applicable. Uniface B.V.

    This product contains confidential information and trade secrets of
    Uniface B.V. Use, disclosure, or reproduction is prohibited without
    the prior express written permission of Uniface B.V.
******************************************************************************/

/*global Promise UNIFACE uniface document _uf */

/*******************************************************************************
date   refnum    version who description
090528 c27361    9401c1  mzu RIA: Introduce this new widget for DSP mashup.
101027 t99504    950101  jnz RIA: API container-contained relationship on dspContainer
date   refnum    version who description
*******************************************************************************/

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.elem2
// The plain HTML widget base class.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.widget.elem2 = function(fieldID) {
    // Call base class
    UNIFACE.widget.AbstractWidget.apply(this, arguments);

    this.controlType = "text";
    this.element = null;
    this.parent = null;
    this.tagName = "span";
};

UNIFACE.widget.elem2.prototype = new UNIFACE.widget.AbstractWidget();
    
UNIFACE.widget.elem2.prototype.getElement = function() {
    return this.element;
};

UNIFACE.widget.elem2.prototype.doRender = function(a_placeHolder) {
    this.parent = a_placeHolder.parentNode;
    this.element = this.createElement(a_placeHolder);
    this.fillAttributes();
    this.element.id = this.callBack.getId();
    this.setElementValue(this.callBack.getValue());
    this.element.style.cssText = a_placeHolder.style.cssText;
    this.parent.replaceChild(this.element, a_placeHolder);
    this.fillStyles();
};

UNIFACE.widget.elem2.prototype.setElementValue = function(aVal) {
    this.element.value = aVal;
};

UNIFACE.widget.elem2.prototype.setValue = function(aVal) {
    // Cache the value if element was not rendered yet....
    if (this.element) {
        this.setElementValue(aVal);
    } 
};

UNIFACE.widget.elem2.prototype.getValue = function() {
    return this.element ? this.element.value : this.callBack.getValue();
};

UNIFACE.widget.elem2.prototype.fillAttributes = function() {
};

UNIFACE.widget.elem2.prototype.fillStyles = function() {
};

UNIFACE.widget.elem2.prototype.createElement = function(a_placeHolder) {
    if (a_placeHolder.tagName.toLowerCase() == this.tagName) {
        return a_placeHolder.cloneNode(true);
    } else {
        return document.createElement(this.tagName);
    }
};

///////////////////////////////////////////////////////////////////////////////
// UNIFACE.widget.embeddedDSP
// The generic HTML widget.
///////////////////////////////////////////////////////////////////////////////

UNIFACE.checkIf = function(b) {
	if ( b ) {
		if ( !(true && b) ) {
			alert("Boolean error!");
		}
	} else {
		if ( true && b ) {
			alert("Boolean error!");
		}
	}
	return (true && b);
};

(function(){

UNIFACE.widget.embeddedDSP = function(fieldID) {
    UNIFACE.widget.elem2.apply(this, arguments);
    this._value = null;    // Private by convention (not by nature).
};

UNIFACE.widget.embeddedDSP.prototype = new UNIFACE.widget.elem2();

UNIFACE.widget.embeddedDSP.prototype.setValue = function(aVal) {
	var v = aVal.toUpperCase();
	
	if ( UNIFACE.checkIf (this._value !== v) ) {
		var oldV = this._value;
	    this._value = v;
	    if ( this.element != null ) { // pragma(allow-loose-compare)
	    	this.unbindingDSP(oldV);
	    	this.bindingDSP(v);
            if (typeof(this.onChange) === "function") {
                var inst = this.callBack.getInstance();
                if ( !inst._pendingDelete ) {
                    this.onChange();
                }
            }
	    }
	}
};

UNIFACE.widget.embeddedDSP.prototype.getValue = function() {
    return this._value;
};

UNIFACE.widget.embeddedDSP.prototype.getDspName = function(anInstanceName) {
	var lProperties = this.callBack.getCalculatedProperties();
    var componentName = "";
  	if ( lProperties.uniface && lProperties.uniface.componentname ) {
   		componentName = lProperties.uniface.componentname;
   	} else {
   		componentName = anInstanceName;
   	}
	return componentName;
};

function callOperation(instName, operName) {
    var dspInstance = uniface.getDSPInstance(instName);
    if (dspInstance && dspInstance._hasOperation(operName) ) {
        dspInstance.activate(operName);
    }
}

UNIFACE.widget.embeddedDSP.prototype.unbindingDSP = function(anInstanceName) {
	if ( typeof anInstanceName !== "string" || anInstanceName === "" ) {
		return;
	}
	
	var cp = _uf.InstanceManager.getInstance(anInstanceName);
	if (cp) {
	    var parentInst = this.callBack.getInstance();
	    cp.parent = null;
	    delete parentInst.children[cp.instanceName];

	    cp.hideTargetNode();
	    callOperation(anInstanceName, "detach");
	    this.dsp = undefined;
	    cp.widget = undefined;
	}
};

UNIFACE.widget.embeddedDSP.prototype.bindingDSP = function(anInstanceName) {
	var cp = null;
    if ( typeof anInstanceName === "string" && anInstanceName !== "" ) {
        cp = _uf.InstanceManager.makeInstance(anInstanceName, this.getDspName(anInstanceName));
        if (true && cp.widget) { 
            var l_w = cp.widget;
            l_w.setValue("");
        }
        this.loadDSP(cp);
    } 
};

UNIFACE.widget.embeddedDSP.prototype.postRender = function(a_placeholder) {
    if (this._value && this.dsp === undefined)
    {
        this.bindingDSP(this._value);
	}
};

UNIFACE.widget.elem2.prototype.createElement = function(a_placeHolder) {
        return document.createElement(this.tagName);

};

UNIFACE.widget.embeddedDSP.prototype.unrender = function() {
	this.setValue("");
};

UNIFACE.widget.embeddedDSP.prototype.loadDSP = function(anInstance) {
    anInstance.widget = this;
    this.dsp = anInstance;
    
    var parentInst = this.callBack.getInstance(); 
    if ( !parentInst.children ) {
      	parentInst.children = {};
    }
    parentInst.children[anInstance.instanceName] = anInstance;
    anInstance.parent = parentInst;
    
    if ( !anInstance.definition ) { // pragma(allow-loose-compare)
        return UNIFACE.dl.loadDSP(anInstance, "embed");
    }
    else
    {
        this.doAttach(anInstance);
        return Promise.resolve();
    }
};

UNIFACE.widget.embeddedDSP.prototype.setLayout = function(anInstance) {
        anInstance.showTargetNode(this.element);
};
	
UNIFACE.widget.embeddedDSP.prototype.doAttach = function(anInstance) {
        this.setLayout(anInstance);
        callOperation(this._value, "attach");
};

UNIFACE.widget.embeddedDSP.prototype.mapEvents = function() {
    var l_evs = this.callBack.getEvents();
    if (l_evs.onchange)
    {
        this.onChange = l_evs.onchange;
        l_evs.onchange.post =  true;
    }
    UNIFACE.addListener(this.element, "ondblclick",l_evs.ondblclick);
    UNIFACE.addListener(this.element, "onclick",  l_evs.onclick   );
    UNIFACE.addListener(this.element, "onfocus",  l_evs.onfocus   );
    UNIFACE.addListener(this.element, "onblur",   l_evs.onblur    );
    UNIFACE.addListener(this.element, "onkeypress",l_evs.onkeypress);
};

UNIFACE.widgetFactory.addCreator("UNIFACE.widget.embeddedDSP",
                         function(fieldID, properties) {
                            return new UNIFACE.widget.embeddedDSP(fieldID);
                         });

})();
// %fv: uwindow.js-19 % %dc: Thu Jun 28 15:32:38 2012 %

/*global UNIFACE document window */
/*global uwindow*/
/*global navigator*/

var uwindow=(function() {

// Background opacity
var OVERLAY_OPACITY = 70;

// Multiple message windows:
var MW_SETSIZE = 10;    // This many windows per diagonal row
var MW_GAP = 25;        // Gap between consecutive windows (in the same row)
var MW_OFFSET = 5;      // Additional vertical offset between rows

// Multi-line related constants:
var MAX_LINES = 8;      // More lines will result in a scroll bar.
var PIX_PER_LINE = 16;

// constants
var CLS_WINDOW = "uwindow";
var CONTENT_HTML = "html";
var CONTENT_IFRAME = "iframe";


var windowBackground;
var windowContainer;

function getStyle(node, propName) {
    if (node.currentStyle) { // IE
        return node.currentStyle[propName];
    } else { // Others
        return document.defaultView.getComputedStyle(node,null).getPropertyValue(propName);
    }
}

function createNode(tagName, className, parentNode) {
    var node = document.createElement(tagName);
    if (className != null) {   // @pragma(allow-loose-compare)
        node.className = className;
    }
    if (parentNode != null) {  // @pragma(allow-loose-compare)
        parentNode.appendChild(node);
    }
    return node;
}

function findUfrmFromInnerNode(node) {
    while (node.tagName.toLowerCase() !== "div" || node.className !== "uwindow") {
        node = node.parentNode;
    }
    return node;
}

function appendTextNodes(parentNode, text) {
    var l_lines = text.split("\n");
    if (l_lines.length > 0) {
        parentNode.appendChild(document.createTextNode(l_lines[0]));
    }
    for (var i = 1; i < l_lines.length; i++) {
        parentNode.appendChild(document.createElement("br")); // preserve line breaks
        if (l_lines[i]) {
            parentNode.appendChild(document.createTextNode(l_lines[i]));
        }
    }
    return l_lines.length;
}

return {
createWindow:function(titlebarText,statusLineString) {
    var i;
    var ufrm = createNode("div", "uwindow");    // form window div
    var titlebar = createNode("div", "utitlebar", ufrm);
    titlebar.appendChild(document.createTextNode(titlebarText));
    var wincontrols = createNode("div", "wincontrols", titlebar);
    var closeButton = createNode("img", null, wincontrols);
    closeButton.src = "../common/images/uwindow/close.jpg";
    closeButton.title = "Close";
    closeButton.onclick = uwindow.closeWindow;
    var clientwindow = createNode("div", "clientwindow", ufrm);
    if (statusLineString !== "") {
        var statusline = createNode("div", "statusline", ufrm);
        statusline.appendChild(document.createTextNode(statusLineString));
    }
    ufrm.clientwindow = clientwindow;
    ufrm.utitlebar = titlebar;

    ufrm.utitlebar.onmousedown=uwindow.wmbuttondown;
    ufrm.utitlebar.hparent=ufrm; // save handle to parent
    ufrm.style.position = "fixed";
    ufrm.style.zIndex = 1;

    ufrm.windowToFront = function() {
        var container = this.parentNode;
        if (container != null) { // @pragma(allow-loose-compare)
            container.removeChild(this);
            container.appendChild(this);
        }
    };
    ufrm.buttonFocus = function () {
        var inputs = this.getElementsByTagName("input");
        for (var i = 0; i < inputs.length; i = i+1) {
            if (inputs[i].name == "defaultButton") {
                inputs[i].focus();
                break;
            }
        }
    };
    ufrm.takeFocus = function() {
        this.windowToFront();
        this.buttonFocus();
    };
    ufrm.onclick = function(event) {
        // We do not want ufrm to take focus if it contains an iframe,
        // because that hides the iframe (in windowToFront)...
        if (this.clientwindow.contenttype != CONTENT_IFRAME) {
            this.takeFocus();
        }
    };

    // Make the window 'modal', by doing the following:
    // - Use a 'background' window that overlays the whole page.
    // - Use a container that has the background-div and the popup-div
    //   as children.
    // This way the whole page is covered by the popup implementation,
    // making the page inaccessible until the popup is clicked away.
    if (windowBackground == null) { // @pragma(allow-loose-compare)
        // Create the background window.
        windowBackground = document.createElement("div");
        windowBackground.className = "usurroundings";
        windowBackground.style.position = "fixed";
        windowBackground.style.top = "0";
        windowBackground.style.left = "0";
        windowBackground.style.width = "100%";
        windowBackground.style.height = "100%";
        windowBackground.style.zIndex = 0;
        windowBackground.style.opacity = OVERLAY_OPACITY / 100;                    // FF
        windowBackground.style.filter = "alpha(opacity=" + OVERLAY_OPACITY + ")";  // IE, Opera
        // Create the container for the background and the uwindow instances.
        windowContainer = document.createElement("div");
        windowContainer.className = "uontop";
        // Add the background window to the container.
        windowContainer.appendChild(windowBackground);
        // Add the container to the document.
        document.body.appendChild(windowContainer);
    }
    // Add the window to the container, and make the container visible.
    windowContainer.appendChild(ufrm);
    windowContainer.style.display = "block";

    return ufrm;
},
moreinfo:function() {
    var ufrm = findUfrmFromInnerNode(this);
    uwindow.setClientContent(ufrm,'iframe', ufrm.moreinfo);
    uwindow.sizePosWindow(ufrm,'center','center',500,250);
},
showFailure:function(titlebartext,messageTxt,statusLineString, moreInfoText)
{   // Hardcoded errorbox with more info button for the total error page
    // Make a windows like gray background and center the stuff.
    var innerHTML = createNode("div");
    innerHTML.style.cssText = "text-align: center; height: 100%;";
    createNode("br", null, innerHTML);
    var img = createNode("img", null, innerHTML);
    img.title = "Close";
    img.src = "../common/images/uwindow/error.gif";
    img.align = "middle";
    var lineCount = appendTextNodes(innerHTML, "\n" + messageTxt);
    createNode("br", null, innerHTML);
    createNode("br", null, innerHTML);
    var okButton = createNode("input", null);
    okButton.type = "button";
    okButton.value = "OK";
    okButton.name = "defaultButton";
    okButton.onclick = uwindow.closeWindow;
    okButton.style.marginRight = "3em";
    innerHTML.appendChild(okButton);    // Could not do this in the createNode call above (because of IE...)
    var moreInfoButton = createNode("input", null);
    moreInfoButton.id = "moreinfo";
    moreInfoButton.type = "button";
    moreInfoButton.value = "More info...";
    moreInfoButton.name = "more";
    moreInfoButton.onclick = uwindow.moreinfo;
    innerHTML.appendChild(moreInfoButton);
    createNode("br", null, innerHTML);
    var ufrm = uwindow.createWindow(titlebartext,statusLineString);
    ufrm.moreinfo = moreInfoText;
    uwindow.setClientContent(ufrm,'html',innerHTML);
    uwindow.sizePosWindow(ufrm,'center','center',220,89+Math.min(lineCount,MAX_LINES)*PIX_PER_LINE);
    uwindow.showWindow(ufrm);
},
showMessage:function(a_title,messageData,buttontext,cx,cy,messageType) // Create standard window  returns the id as handle
{
    var cxLeft = 50; // 20px margin plus image
    var cxDef  = 190;
    var cyDef = 89;
    var lineCount;
    var cxTotal;
    var innerHTML = createNode("div");
    innerHTML.style.cssText = "text-align:center; height:100%;";
    createNode("br", null, innerHTML);
    var img = createNode("img", null, innerHTML);
    img.title = "Close";
    img.src = "../common/images/uwindow/" + messageType + ".gif";
    img.align = "middle";
    lineCount = appendTextNodes(innerHTML, "\n" + messageData);
    createNode("br", null, innerHTML);
    createNode("br", null, innerHTML);
    var defaultButton = createNode("input", null);
    defaultButton.type = "button";
    defaultButton.value = buttontext;
    defaultButton.name = "defaultButton";
    defaultButton.onclick = uwindow.closeWindow;
    innerHTML.appendChild(defaultButton);
    createNode("br", null, innerHTML);
    var ufrm = uwindow.createWindow(a_title,"");

    // 12 chars requires approx 240 pixels
    if (messageData.length) {
        cxDef = messageData.length * 10;
    }
    if (cx === 0){
        cxTotal = cxDef+cxLeft;
        cxTotal = Math.min(cxTotal,400);
    } else {
        cxTotal = cx;
    }
    if (cy !== 0){
       cyDef = cy;
    }
    cyDef = cyDef + Math.min(lineCount,MAX_LINES) * PIX_PER_LINE;
    uwindow.setClientContent(ufrm,'html',innerHTML);
    uwindow.sizePosWindow(ufrm,'center','center',cxTotal,cyDef);
    uwindow.showWindow(ufrm);
},
getviewpoint:function(){
    var ie=document.all && !window.opera;
    var domclientWidth=document.documentElement && parseInt(document.documentElement.clientWidth,10) || 100000;
    this.standardbody=(document.compatMode==="CSS1Compat")? document.documentElement : document.body;
    this.scroll_top=0;//(ie)? this.standardbody.scrollTop : window.pageYOffset;
    this.scroll_left=0;//(ie)? this.standardbody.scrollLeft : window.pageXOffset;
    this.docwidth=(ie)? this.standardbody.clientWidth : (/Safari/i.test(navigator.userAgent))? window.innerWidth : Math.min(domclientWidth, window.innerWidth-16);
    this.docheight=(ie)? this.standardbody.clientHeight: window.innerHeight;
},
sizeWindow:function(ufrm,cx,cy){
    ufrm.style.width=Math.max(parseInt(cx,10),150)+"px";
    ufrm.clientwindow.style.height=Math.max(parseInt(cy,10),75)+"px";
},
sizePosWindow:function(ufrm,x,y,cx,cy){
    this.getviewpoint();
    var extraOffset = 0;
    var count = windowContainer.childNodes.length+MW_SETSIZE/2 - 2;
    if (x === "center") {
        extraOffset = MW_GAP * ((count % MW_SETSIZE - Math.floor(count / MW_SETSIZE)) - MW_SETSIZE/2);
        ufrm.style.left = this.scroll_left+(this.docwidth-ufrm.offsetWidth)/2+extraOffset+"px";
    } else {
        ufrm.style.left = this.scroll_left+parseInt(x,10)+"px";
    }
    if (y === "center") {
        extraOffset = MW_GAP * ((count % MW_SETSIZE) - MW_SETSIZE/2) + MW_OFFSET * Math.floor(count / MW_SETSIZE);
        ufrm.style.top = this.scroll_top+(this.docheight-ufrm.offsetHeight)/2+extraOffset+"px";
    } else {
        ufrm.style.top = this.scroll_top+parseInt(y,10)+"px";
    }
    this.sizeWindow(ufrm,cx,cy);
},
killChildNode:function(ufrm){
    // remove child div or child iframe
    ufrm.clientwindow.removeChild(ufrm.clientwindow.childNodes[0]);
    ufrm.clientwindow.contenttype="";
},
closeWindow:function() {
    var ufrm = findUfrmFromInnerNode(this);
    if (ufrm.clientwindow.contenttype !== "")
    {// remove child div or child iframe
        ufrm.clientwindow.removeChild(ufrm.clientwindow.childNodes[0]);
    }
    ufrm.clientwindow.contenttype="";
    ufrm.clientwindow.contenttype="";
    ufrm.clientwindow.style.overflow="";
    ufrm.clientwindow.innerHTML="";
    ufrm.parentNode.removeChild(ufrm);
    ufrm.style.display="none";
    ufrm = null;
    // If the windowBackground is the only child of the window container,
    // then it contains no actual windows anymore.
    var windowCount = windowContainer.childNodes.length - 1;
    if (windowCount <= 0) {
        // Hide the window container.
        windowContainer.style.display = "none";
    } else {
        // Find the last window.
        ufrm = windowContainer.childNodes[windowCount];
        ufrm.takeFocus();
    }
},
showWindow:function(ufrm){
    ufrm.style.display="block";
    ufrm.style.visibility = "visible";
    ufrm.buttonFocus();
},
setClientContent:function(ufrm,contenttype,contentsource){
    var lFrame = null;
    var lName  = null;
    var oldContenttype = ufrm.clientwindow.contenttype;
    // if switching from html to iframe, we remove first the div children from the
    // clientwindow.
    if ( oldContenttype ==CONTENT_HTML || oldContenttype ==CONTENT_IFRAME){
        uwindow.killChildNode(ufrm);
    }
    if (contenttype==CONTENT_IFRAME)
    {
        lFrame = window.document.createElement("iframe");
        lFrame.style.cssText = "margin:0; padding:0; width:100%; height: 100%";
        ufrm.clientwindow.style.overflow="hidden";
        ufrm.clientwindow.contenttype = contenttype;
        lName = "wnd_name";
        lFrame.name = lName;
        ufrm.clientwindow.appendChild(lFrame);
    }
    if (contenttype==CONTENT_IFRAME && lFrame !== null)
    {   var oDoc = lFrame.contentWindow || lFrame.contentDocument;
        if (oDoc.document) {
            oDoc = oDoc.document;
        }
        oDoc.open();
        oDoc.write(contentsource);
        oDoc.close();
    } else if (contenttype==CONTENT_HTML) {
        ufrm.clientwindow.style.overflow="";
        //ufrm.clientwindow.innerHTML=contentsource;
        ufrm.clientwindow.appendChild(contentsource);
        ufrm.clientwindow.contenttype = contenttype;
    }
},
wmbuttondown:function(evt){
    var e;
    var ufrm=this.hparent; // get parent handle
    var f = uwindow;
    f.clickedObj=this;
    e=window.event || evt;
    f.xpos=e.clientX;
    f.ypos=e.clientY;
    f.initx=parseInt(getStyle(ufrm,"left"),10);
    f.inity=parseInt(getStyle(ufrm,"top"),10);
    f.width=parseInt(ufrm.offsetWidth,10);
    f.clientwindowheight=parseInt(ufrm.clientwindow.offsetHeight,10);
    if (ufrm.clientwindow.contenttype===CONTENT_IFRAME){
        ufrm.clientwindow.style.visibility="hidden";
    }
    document.onmousemove=f.wmmousemove;
    document.onmouseup=function()
    {
        if (ufrm.clientwindow.contenttype===CONTENT_IFRAME) {
            ufrm.clientwindow.style.backgroundColor="white";
            ufrm.clientwindow.style.visibility="visible";
        }
        f.clickedObj=null;
        document.onmousemove=null;
        document.onmouseup=null;
    };
    return false;
},
wmmousemove:function(evt){
    var e;
    var f = uwindow;
    var hparent;
    e=window.event || evt;
    f.dx=e.clientX-f.xpos;
    f.dy=e.clientY-f.ypos;
    if (f.clickedObj.className==="utitlebar") {
        hparent = f.clickedObj.hparent;
        hparent.style.left=f.dx+f.initx+"px";
        if (f.inity < 0) {
            f.inity = f.ypos;
        }
        hparent.style.top=f.dy+f.inity+"px";
    }
    return false;
}
};
}());

UNIFACE.extension.register("popupWindow", uwindow);
/*global UNIFACE */

/**
 * Busy indicator.
 * Has separate busy indicators for synchronous and asynchronous busy-ness.
 * For the synchronous case the indicator is shown immediately, and turned off
 * as soon as setBusy(false,true) is called.
 * For the asynchronous case the indicator is only shown after a short delay.
 * This takes care that the indicator is only shown for cases that take a
 * relatively long time.
 * For the asynchronous case this busyIndicator also counts the number of
 * open setBusy(true,false) calls.  The indicator is only turned off after all
 * open calls have been closed, by setBusy(false,false) calls.
 */
UNIFACE.busyIndicator = (function() {

    // Private members:
    var _DELAY = 750;
    var _busy = 0;
    var _syncBusyIndicator;
    var _asyncBusyIndicator;

    function _appendElement(node, tag, id, className) {
        var elem = document.createElement(tag);
        if (id) {
            elem.id = id;
        }
        node.appendChild(elem);
        elem.className = className;
        return elem;
    }
    function _setVisibility(node, isVisible) {
        if (isVisible) {
            // Make visible.
            node.style.visibility = "visible";
        } else {
            // Make invisible.
            node.style.visibility = "hidden";
        }
    }
    function _getBusyIndicatorElement(busyIndicatorCSSClass) {
    	var id = "UNIFACE." + busyIndicatorCSSClass;
        var elem = document.getElementById(id);
        if (elem == undefined) { // pragma(allow-loose-compare)
            // The element does not exist yet; create one here.
            elem = _appendElement(document.body, "div", id, busyIndicatorCSSClass);
        }
        return elem;
    }
    function _getSyncBusyIndicator() {
        if (_syncBusyIndicator == undefined) { // pragma(allow-loose-compare)
            _syncBusyIndicator = _getBusyIndicatorElement("ubusysync");
        }
        return _syncBusyIndicator;
    }
    function _getAsyncBusyIndicator() {
        if (_asyncBusyIndicator == undefined) { // pragma(allow-loose-compare)
            _asyncBusyIndicator = _getBusyIndicatorElement("ubusyasync");
        }
        return _asyncBusyIndicator;
    }
    function _showSync(aBusy) {
    	_setVisibility(_getSyncBusyIndicator(), aBusy);
    }
    function _showAsync() {
        _setVisibility(_getAsyncBusyIndicator(), _busy  > 0);
    }

    // Public:
    return {
        setBusySync : function(isBusy) {
            // Immediately show the indicator.
            _showSync(isBusy);
        },
        setBusyAsync : function(isBusy) {
            if (isBusy) {
                if (++_busy == 1) {
                    // Wait a little while before showing.
                    window.setTimeout(_showAsync, _DELAY);
                }
            } else {
                // Decrease async-busy counter.
                // If counted down to zero then immediately show.
                if (--_busy <= 0) {
                    _showAsync();
                    _busy = 0; // Reset to zero, just in case it was even less...
                }
            }
        }
    };
})();

UNIFACE.extension.register("busyIndicator", UNIFACE.busyIndicator);
