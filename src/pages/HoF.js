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
      }, {
        name: 'Pete Santos',
        dates: 'May 2019 - March 2020',
        pic: 'https://github.com/petesantos.png?size=200'
      }, {
        name: 'Isaac Zarsky',
        dates: 'February 2018 - May 2020',
        pic: 'https://github.com/zarsky-broad.png?size=200'
      },
      {
        name: 'Adrian Sharma',
        dates: 'October 2019 - May 2020',
        pic: 'https://ca.slack-edge.com/E0166C33N6A-W016LL7S70B-59279567a73f-512'
      },
      {
        name: 'Cameron Ardell',
        dates: 'July 2019 - September 2020',
        pic: 'https://github.com/cameron-ardell.png?size=200'
      },
      {
        name: 'Kai Feldman',
        dates: 'June 2020 - October 2020',
        pic: 'https://github.com/Shakespeared.png?size=200'
      },
      {
        name: 'Sky Rubenstein',
        dates: 'May 2020 - October 2020',
        pic: 'https://github.com/s-rubenstein.png?size=200'
      },
      {
        name: 'Amelia Sagoff',
        dates: 'May 2019 - October 2020',
        pic: 'https://ca.slack-edge.com/E0166C33N6A-W016J6KHYD9-gfb9968e159b-512'
      },
      {
        name: 'Imani Harrison',
        dates: 'August 2019 - October 2020',
        pic: 'https://ca.slack-edge.com/E0166C33N6A-W016J7JRP51-8cc61da30e32-512'
      },
      {
        name: 'Emily Hanna',
        dates: 'August 2019 - October 2020',
        pic: 'https://github.com/ehanna4.png?size=200'
      },
      {
        name: 'Brian Reilly',
        dates: 'November 2018 - October 2020',
        pic: 'https://github.com/breilly2.png?size=200'
      },
      {
        name: 'Brett Heath-Wlaz',
        dates: 'April 2018 - October 2020',
        pic: 'https://github.com/panentheos.png?size=200'
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
