var Audio = (function(){
	var audio_context = window.AudioContext ? new AudioContext() : new webkitAudioContext(),
		_id = 0;

	var AudioTrack = function( name, src ) {
		this.id = _id++;
		this.name = name;
		this.uri = typeof src === 'string' ? src : null;
		this.buffer = null;
		this.dependencies = [];

		if ( this.uri !== null ) {
			ajax( 'get', 'resources/sounds/' + src, this.onload, this, 'arraybuffer' );
		} else {
			this.buffer = src;
		}
	};
	AudioTrack.prototype.onload = function( request ) {
		var self = this;

		audio_context.decodeAudioData(
			request.response,
			function( buffer ) {
				self.buffer = buffer;
				for ( var i = 0; i < self.dependencies.length; i++ ) {
					self.dependencies[i].assignAudioBuffer( self.buffer );
				}
			},
			function() {
				throw 'Error decoding audio data for ' + self.uri;
			}
		);
	};
	AudioTrack.prototype.addDependancy = function( who ) {
		this.dependencies.push( who );
		if ( this.buffer ) {
			who.assignAudioBuffer( this.buffer );
		}
	};

	var AudioSource = function( audio_track, position ) {
		this.volume = audio_context.createGain();
		this.source = audio_context.createBufferSource();

		if ( position ) {
			this.panner = audio_context.createPanner();
			this.panner.setPosition( position.x, position.y, position.z );

			this.source.connect( this.panner );
			this.panner.connect( this.volume );
		} else {
			this.panner = null;
			this.source.connect( this.volume );
		}
		this.volume.connect( Audio.output );

		audio_track.addDependancy( this );
	};
	AudioSource.prototype.assignAudioBuffer = function( buffer ) {
		this.source.buffer = buffer;
	};
	AudioSource.prototype.play = function() {
		this.source.start( audio_context.currentTime );
	};
	Object.defineProperty(
		AudioSource.prototype,
		'loop',
		{
			get: function() {
				return this.source.loop;
			},
			set: function ( value ) {
				this.source.loop = value;
			}
		}
	);

	var microphone_sample_rate = 256,
		microphone_node = audio_context.createScriptProcessor( microphone_sample_rate, 2, 1 );

	return {
		microphone: (function(){
			var is_recording = false,
				recording_buffers = [],
				buffer_length;

			microphone_node.onaudioprocess = function ( ev ) {
				var channel_l = ev.inputBuffer.getChannelData( 0 ),
					channel_r = ev.inputBuffer.getChannelData( 1 );

				ev.outputBuffer.getChannelData( 0 ).set( channel_l, 0 );

				if ( is_recording ) {
					buffer_length += channel_l.length;

					var new_buffer = new Float32Array( ev.inputBuffer.getChannelData( 0 ).length ),
						i;
					for ( i = 0; i < new_buffer.length; i++ ) {
						new_buffer[i] = 0.5 * ( channel_l[i] + channel_r[i] );
					}
					recording_buffers.push( new_buffer );
				}
			};

			return {
				isRecording: function() {
					return is_recording;
				},

				record: function() {
					recording_buffers.length = 0;
					buffer_length = 0;
					is_recording = true;
				},

				stop: function() {
					is_recording = false;
					if ( recording_buffers.length > 0 ) {
						var buffer = new Float32Array( buffer_length ),
							offset = 0,
							i;

						for ( i = 0; i < recording_buffers.length; i++ ) {
							buffer.set( recording_buffers[i], offset );
							offset += recording_buffers[i].length;
						}

						var audio_buffer = audio_context.createBuffer( 1, buffer_length, 44100 );
						audio_buffer.getChannelData( 0 ).set( buffer, 0 );
						return audio_buffer;
					}
				}
			};
		})(),

		output: (function(){
			var output = audio_context.createGain();

			// Connect output to speakers
			output.connect( audio_context.destination );

			// Set up the microphone input
			//microphone_node.connect( audio_context.destination );
			output.connect( microphone_node );

			// The microphone *has to be* connected to destination for it to process anything. That's stupid
			var microphone_gain = audio_context.createGain();
			microphone_node.connect( microphone_gain );
			microphone_gain.connect( audio_context.destination );
			microphone_gain.gain.value = 0;

			return output;
		})(),

		tracks: {},

		Track: AudioTrack,
		Source: AudioSource,

		setListenerPosition: function( position ) {
			audio_context.listener.setPosition( position.x, position.y, position.z );
		},

		setListenerOrientation: function( orientation ) {
			audio_context.listener.setOrientation( orientation.x, orientation.y, orientation.z, 0, 1, 0 );
		},

		load: function( name, src ) {
			var track = new AudioTrack( name, src );
			Audio.tracks[name] = track;
		}
	};
})();