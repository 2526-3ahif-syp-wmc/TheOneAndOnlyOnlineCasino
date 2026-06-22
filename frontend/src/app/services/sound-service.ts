import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  private winSound = new Audio('/sounds/win.wav');
  private loseSound = new Audio('/sounds/lose.wav');
  private rouletteSpinSound = new Audio('/sounds/roulette-spin.wav');
  private cashoutSound = new Audio('/sounds/cashout.wav');

  playWin(): void {
    this.play(this.winSound);
  }

  playLose(): void {
    this.play(this.loseSound);
  }

  playCashout(): void {
    this.play(this.cashoutSound);
  }

  playRouletteSpin(): void {
    this.play(this.rouletteSpinSound);
  }

  stopRouletteSpin(): void {
    this.rouletteSpinSound.pause();
    this.rouletteSpinSound.currentTime = 0;
  }

  private play(sound: HTMLAudioElement): void {
    sound.currentTime = 0;
    sound.play().catch(error => {
      console.error('Sound could not be played:', error);
    });
  }
}