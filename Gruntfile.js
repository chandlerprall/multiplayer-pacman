var fs = require( 'fs' );

module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      license: fs.readFileSync( 'LICENSE' ).toString(),
      banner: '/*\n' +
        '<%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>\n\n' +
        '<%= meta.license %>\n' +
        '*/'
    },
	less: {
		production: {
			options: {
				compress: true,
				ieCompat: false,
				report: 'min'
			},
			files: {
				'build/pacman.css': 'src/less/**/*.less'
			}
		}
	},
	concat: {
	  dist: {
         src: [
		   '<banner:meta.banner>',
		   'src/intro.js',
			 'src/classes/**/*.js',
			 'src/events/**/*.js',
			 'src/init.js',
		   'src/outro.js'
	     ],
         dest: 'build/pacman.js'
	  }
	},
    min: {
      build: {
        src: ['<banner:meta.banner>', '<config:concat.build.dest>'],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },
    jshint: {
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
		smarttabs: true,
		globals: {
			'AudioContext': false,
			'webkitAudioContext': false,
			'mozAudioContext': false,
			'audioContext': false,
			'_': false,

			'Game': true,
			'Utils': true,
			'Screen': true,
			'Template': true,
			'Events': true,
			'Audio': true,
			'ajax': true,
			'Map': true,
			'Actor': true
		}
      },
	  beforeconcat: ['src/classes/**/*.js', 'src/events/**/*.js', 'init.js']
    }
  });

  // Default task.
  grunt.registerTask('default', ['less', 'jshint', 'concat']);

};
