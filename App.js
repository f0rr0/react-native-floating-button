import React, { Component, Children } from 'react'
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  Easing,
  TouchableOpacity,
  TouchableNativeFeedback,
  Platform
} from 'react-native'

const USE_NATIVE_DRIVER = true
const { width: WIDTH } = Dimensions.get('window')
const RADIUS = 120
const PARENT_SIZE = 60
const ITEM_SIZE = 40
const CAPTION_SPACING = 10
const CAPTION_SIZE = 16
const CAPTION_LINE_HEIGHT = 18

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: 'white'
  },
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'grey'
  },
  container: {
    ...StyleSheet.absoluteFillObject
  },
  parentButtonContainer: {
    position: 'absolute',
    left: (WIDTH / 2) - (PARENT_SIZE / 2),
    bottom: 0,
    width: PARENT_SIZE,
    height: PARENT_SIZE
  },
  parentButtonLayout: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PARENT_SIZE / 2,
  },
  parentButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center'
  },
  childButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: (WIDTH / 2) - (ITEM_SIZE / 2),
    width: ITEM_SIZE,
    height: ITEM_SIZE
  },
  childButtonLayout: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2
  },
  childButton: {
    backgroundColor: 'fuchsia',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 30,
    lineHeight: 30,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: Platform.select({
      android: 5,
      ios: 0
    })
  }
})

const Touchable = ({ onPress, children, activeOpacity, style }) => Platform.select({
  android: (
    <TouchableNativeFeedback
      onPress={onPress}
      borderless
      style={style}
    >
      {Children.only(children)}
    </TouchableNativeFeedback>
  ),
  ios: (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      style={style}
      onPress={onPress}
    >
      {Children.only(children)}
    </TouchableOpacity>
  )
})

const initializeAnimatedValues = count => ({
  parent: new Animated.Value(0),
  children: Array(count).fill(null).map(() => new Animated.Value(0)),
  angles: Array(count).fill(null).map((__, index) => ({
    vertical: new Animated.Value(-Math.sin((Math.PI / (count + 1)) * (index + 1))),
    horizontal: new Animated.Value(Math.cos((Math.PI / (count + 1)) * (index + 1)))
  }))
})

const createAnimation = (config, animatedValues, radius, retract) => {
  return retract ? Animated.parallel([
    Animated.timing(animatedValues.parent, {
      toValue: 0,
      useNativeDriver: USE_NATIVE_DRIVER,
      ...config.parent
    }),
    ...animatedValues.children.map(value => Animated.spring(value, {
      toValue: 0,
      useNativeDriver: USE_NATIVE_DRIVER,
      ...config.children.retract
    }))
  ]) : Animated.parallel([
    Animated.timing(animatedValues.parent, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      ...config.parent
    }),
    Animated.stagger(120, animatedValues.children.map(value => Animated.spring(value, {
      toValue: radius,
      useNativeDriver: USE_NATIVE_DRIVER,
      ...config.children.release
    })).reverse())
  ])
}

const getChildrenStyles = ({ children, angles }, radius, index) => ({
  transform: [
    { translateX: Animated.multiply(children[index], angles[index].horizontal) },
    { translateY: Animated.multiply(children[index], angles[index].vertical) }
  ],
  opacity: children[index].interpolate({
    inputRange: [5, radius],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  })
})

const getParentInactiveTransforms = ({ parent }) => ([
  { rotate: parent.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
])

const FloatingButtonItem = ({ children }) => (
  <View>

  </View>
)


export default class App extends Component {
  animatedValues = initializeAnimatedValues(4)
  radius = RADIUS

  state = {
    active: false
  }

  animate = () => this.setState(({ active }) => ({ active: !active }), () => {
    this.state.active ? createAnimation({
      parent: {
        duration: 350
      },
      children: {
        release: {
          duration: 700,
          bounciness: 1,
          speed: 30
        }
      }
    }, this.animatedValues, this.radius, false).start()
    : createAnimation({
      parent: {
        duration: 350
      },
      children: {
        retract: {
          duration: 700,
          bounciness: 0,
          speed: 40
        }
      }
    }, this.animatedValues, this.radius, true).start()
  })

  render() {
    return (
      <View style={styles.app}>
        <View style={styles.root}>
          <View style={styles.container}>
            {this.animatedValues.children.map((__, index) => (
              <Touchable
                onPress={this.animate}
                key={index}
                style={styles.childButtonContainer}
                activeOpacity={0.8}
              >
                <Animated.View style={getChildrenStyles(this.animatedValues, this.radius, index)}>
                  <View style={[styles.childButtonLayout, styles.childButton]} />
                  {/* <Text style={{ fontSize: 35 }}>Caption</Text> */}
                </Animated.View>
              </Touchable>
            ))}
            <Touchable activeOpacity={0.8} style={styles.parentButtonContainer} onPress={this.animate}>
              <View style={styles.parentButtonLayout}>
                <Animated.View
                  style={[styles.parentButtonLayout, styles.parentButton, {
                    transform: [
                      ...getParentInactiveTransforms(this.animatedValues)
                    ],
                    opacity: this.animatedValues.parent.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0]
                    })
                  }]}
                >
                  <Text style={styles.text}>+</Text>
                </Animated.View>
                <Animated.View
                  style={[styles.parentButtonLayout, styles.parentButton, { backgroundColor: 'blue', opacity: 0 }, {
                    transform: [
                      ...getParentInactiveTransforms(this.animatedValues)
                    ],
                    opacity: this.animatedValues.parent.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1]
                    })
                  }]}
                >
                  <Text style={styles.text}>+</Text>
                </Animated.View>
              </View>
            </Touchable>
          </View>
        </View>
      </View>
    )
  }
}
