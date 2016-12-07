/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SspCylSceneService, SspCylSceneProvider } from './ssp-cyl-scene.service';
import { VRSceneService, VRSceneServiceProvider } from './vr-scene.service';

describe('Service: SspCylScene', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SspCylSceneProvider, VRSceneServiceProvider]
    });
  });

  it('should ...', inject([SspCylSceneService], (service: SspCylSceneService) => {
    expect(service).toBeTruthy();
  }));
});