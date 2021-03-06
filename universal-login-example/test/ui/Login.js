import 'jsdom-global/register';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import {configure, mount} from 'enzyme';
import TestHelper from 'universal-login-contracts/test/testHelper';
import basicContracts from '../fixtures/basicContracts';
import ServicesUnderTest from '../helpers/ServicesUnderTests';
import RelayerUnderTest from 'universal-login-relayer/build/utils/relayerUnderTest';
import {createMockProvider} from 'ethereum-waffle';
import App from '../../src/components/App';
import {expect} from 'chai';
import {waitUntil} from '../utils';

configure({adapter: new Adapter()});

describe('UI: Login', () => {
  let relayer;
  const testHelper = new TestHelper();
  let tokenContract;
  let clickerContract;
  let services;
  let appWrapper;
  
  beforeEach(async () => {
    const provider = createMockProvider();
    relayer = await RelayerUnderTest.createPreconfigured(provider);
    await relayer.start();
    ({clickerContract, tokenContract} = await testHelper.load(basicContracts));
    services = await ServicesUnderTest.createPreconfigured(provider, relayer, clickerContract.address, tokenContract.address);
    appWrapper = mount(<App services={services}/>);
  });

  it('create identity', async () => {    
    const name = 'my-name';
    const input = appWrapper.find('input');

    expect(input.value).to.eq(undefined);

    input.simulate('change', {target: {value: name}});
 
    const hasChangedOn = (message) => {
      appWrapper.update();
      return appWrapper.text().includes(message);
    };

    await waitUntil(hasChangedOn, 5, 2000, ['create']);
    appWrapper.find('.create').simulate('click');

    await waitUntil(hasChangedOn, 5, 500, ['Creating new identity...']);
    expect(appWrapper.html()).to.contain(`${name}`);
    expect(appWrapper.html()).to.contain('Creating new identity...');

    await waitUntil(hasChangedOn, 5, 2000, ['You created a new account']);
    expect(appWrapper.html()).to.contain(`${name}`);
    expect(appWrapper.html()).to.contain('You created a new account');
    expect(appWrapper.html()).to.contain('Received 20 <em>kliks</em>');
  });

  afterEach(async () => {
    await relayer.stop();
    await services.stop();
  });
});
