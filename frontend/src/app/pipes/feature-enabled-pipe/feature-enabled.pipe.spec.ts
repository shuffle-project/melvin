import { FeatureEnabledPipe } from './feature-enabled.pipe';

describe('FeatureEnabledPipe', () => {
  it('create an instance', () => {
    const pipe = new FeatureEnabledPipe();
    expect(pipe).toBeTruthy();
  });
});
