import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, img } from 'react-hyperscript-helpers'
import * as Style from 'src/libs/style'


const HallOfFame = () => {
  return div({ role: 'main', style: { flexGrow: 1, margin: '2rem', ...Style.proportionalNumbers } }, [
    div({ style: { display: 'flex', alignItems: 'center', fontSize: '4.5rem', marginBottom: '1rem' } }, [
      img({
        src: 'https://avatars1.githubusercontent.com/t/3133227?v=4',
        style: { height: 80, marginRight: '1rem' },
        alt: 'Saturn logo'
      }),
      'Team Saturn Hall Of Fame'
    ]),
    h(Fragment, _.map(({ name, dates, pic }) => div({
      style: { display: 'flex', alignItems: 'center', margin: '1rem' }
    }, [
      img({ src: pic, style: { height: 50, marginRight: '1rem' }, alt: `${name} photo` }),
      div([dates, div({ style: { fontSize: '2rem' } }, [name])])
    ]), [
      {
        name: 'David Mohs',
        dates: 'February 2018 - June 2018',
        pic: 'https://github.com/dmohs.png?size=200'
      }, {
        name: 'Matt Putnam',
        dates: 'April 2018 - November 2018',
        pic: 'https://github.com/MattPutnam.png?size=200'
      }, {
        name: 'Liz Zhao',
        dates: 'August 2018 - June 2019',
        pic: 'https://avatars.slack-edge.com/2018-11-08/476604486422_f97f1f3eabb96616a390_192.png'
      }, {
        name: 'Kendra West',
        dates: 'March 2018 - June 2019',
        pic: 'https://avatars.slack-edge.com/2017-01-06/124501653364_279c630ca5dbf2dbdbc0_192.jpg'
      }, {
        name: 'Brad Taylor',
        dates: 'February 2018 - July 2019',
        pic: 'https://github.com/bradtaylor.png?size=200'
      }, {
        name: 'Kate Voss',
        dates: 'August 2018 - July 2019',
        pic: 'https://github.com/katevoss.png?size=200'
      }
    ]))
  ])
}

export const navPaths = [
  {
    name: 'hall-of-fame',
    path: '/HoF',
    component: HallOfFame,
    public: true,
    title: 'Hall of Fame'
  }
]
